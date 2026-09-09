package org.ecommerce.backend.application.service;

import org.ecommerce.backend.application.factory.DiscountChainFactory;
import org.ecommerce.backend.domain.discount.DiscountChain;
import org.ecommerce.backend.domain.exception.EmptyCartException;
import org.ecommerce.backend.domain.exception.InsufficientStockException;
import org.ecommerce.backend.domain.exception.ProductNotFoundException;
import org.ecommerce.backend.domain.model.CartItem;
import org.ecommerce.backend.domain.model.CategoryType;
import org.ecommerce.backend.domain.model.DiscountBreakdown;
import org.ecommerce.backend.domain.model.DiscountContext;
import org.ecommerce.backend.infrastructure.persistence.entity.Coupon;
import org.ecommerce.backend.infrastructure.persistence.entity.Order;
import org.ecommerce.backend.infrastructure.persistence.entity.OrderItem;
import org.ecommerce.backend.infrastructure.persistence.entity.Product;
import org.ecommerce.backend.infrastructure.persistence.entity.StateCoupon;
import org.ecommerce.backend.infrastructure.persistence.repository.CouponRepository;
import org.ecommerce.backend.infrastructure.persistence.repository.OrderRepository;
import org.ecommerce.backend.infrastructure.persistence.repository.ProductRepository;
import org.ecommerce.backend.infrastructure.persistence.repository.StateCouponRepository;
import org.ecommerce.backend.web.dto.CheckoutItemRequest;
import org.ecommerce.backend.web.dto.CheckoutRequest;
import org.ecommerce.backend.web.dto.CheckoutResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CheckoutService {

    private static final String USED_COUPON_STATE_NAME = "USADO";

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;
    private final StateCouponRepository stateCouponRepository;
    private final DiscountChainFactory discountChainFactory;

    public CheckoutService(
            ProductRepository productRepository,
            OrderRepository orderRepository,
            CouponRepository couponRepository,
            StateCouponRepository stateCouponRepository,
            DiscountChainFactory discountChainFactory
    ) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.couponRepository = couponRepository;
        this.stateCouponRepository = stateCouponRepository;
        this.discountChainFactory = discountChainFactory;
    }

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new EmptyCartException();
        }

        List<Product> lockedProducts = new ArrayList<>();
        List<CartItem> cartItems = new ArrayList<>();

        for (CheckoutItemRequest itemRequest : request.items()) {
            Product product = productRepository.findWithLockById(itemRequest.productId())
                    .orElseThrow(() -> new ProductNotFoundException(itemRequest.productId()));

            CartItem cartItem = toCartItem(product, itemRequest.quantity());
            product.setStock(product.getStock() - itemRequest.quantity());

            lockedProducts.add(product);
            cartItems.add(cartItem);
        }

        productRepository.saveAll(lockedProducts);

        DiscountContext context = new DiscountContext(cartItems, request.couponCode());
        DiscountChain chain = discountChainFactory.create();
        DiscountBreakdown breakdown = chain.execute(context);

        // Si llegamos hasta aca con un couponCode no vacio, el cupon paso la
        // validacion de CouponDiscountRule (si fuera invalido o vencido, la
        // linea de arriba ya habria lanzado InvalidCouponException y todo
        // esto se revierte por el @Transactional, incluyendo el stock ya
        // decrementado en memoria). O sea que este cupon se uso de verdad
        // en una compra confirmada: hay que "quemarlo" -pasarlo a estado
        // USADO- para que no sirva en una proxima compra ni vuelva a
        // validar como activo en GET /api/coupons/{code}.
        Coupon usedCoupon = findAndMarkCouponAsUsed(request.couponCode());

        Order order = buildOrder(breakdown, usedCoupon);
        for (int i = 0; i < cartItems.size(); i++) {
            order.getItems().add(buildOrderItem(order, lockedProducts.get(i), cartItems.get(i)));
        }

        Order savedOrder = orderRepository.save(order);

        return toResponse(savedOrder.getId(), breakdown);
    }

    /**
     * Igual que checkout(), pero de solo lectura: no bloquea productos, no
     * decrementa stock, no crea ninguna Order y -a diferencia de
     * checkout()- NUNCA marca el cupon como usado. Sirve para que el
     * frontend le muestre al cliente el desglose de descuentos (categoria
     * + volumen + cupon + tope 35%) ANTES de confirmar la compra real, sin
     * efectos secundarios sobre el inventario ni sobre el cupon. Reutiliza
     * el mismo DiscountChain que el checkout real, asi que el numero que
     * se previsualiza es exactamente el mismo que se cobra despues.
     */
    @Transactional(readOnly = true)
    public CheckoutResponse simulate(CheckoutRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new EmptyCartException();
        }

        List<CartItem> cartItems = new ArrayList<>();
        for (CheckoutItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ProductNotFoundException(itemRequest.productId()));
            cartItems.add(toCartItem(product, itemRequest.quantity()));
        }

        DiscountContext context = new DiscountContext(cartItems, request.couponCode());
        DiscountChain chain = discountChainFactory.create();
        DiscountBreakdown breakdown = chain.execute(context);

        return toResponse(null, breakdown);
    }

    /**
     * Busca el cupon por codigo y, si existe, lo pasa a estado USADO y lo
     * guarda. Devuelve null si no habia codigo de cupon (compra sin cupon)
     * o si el codigo no corresponde a ningun cupon persistido -caso raro,
     * porque para llegar aca ya tuvo que pasar CouponDiscountRule, pero se
     * maneja con la misma tolerancia que el resto del metodo-.
     */
    private Coupon findAndMarkCouponAsUsed(String couponCode) {
        if (couponCode == null || couponCode.isBlank()) {
            return null;
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(couponCode).orElse(null);
        if (coupon == null) {
            return null;
        }

        StateCoupon usedState = stateCouponRepository.findByNameIgnoreCase(USED_COUPON_STATE_NAME)
                .orElseThrow(() -> new IllegalStateException(
                        "Falta el estado '" + USED_COUPON_STATE_NAME + "' en state_coupon (revisar data.sql)"));

        coupon.setState(usedState);
        return couponRepository.save(coupon);
    }

    private CartItem toCartItem(Product product, Integer quantity) {
        if (product.getStock() < quantity) {
            throw new InsufficientStockException(product.getId(), quantity, product.getStock());
        }
        return new CartItem(
                product.getId(),
                product.getName(),
                product.getUnitPrice(),
                quantity,
                toCategoryType(product)
        );
    }

    private CategoryType toCategoryType(Product product) {
        return "Tecnologia".equalsIgnoreCase(product.getCategory().getName())
                ? CategoryType.TECNOLOGIA
                : CategoryType.OTRO;
    }

    private CheckoutResponse toResponse(Long orderId, DiscountBreakdown breakdown) {
        return new CheckoutResponse(
                orderId,
                breakdown.subtotalOriginal(),
                breakdown.categoryDiscountAmount(),
                breakdown.volumeDiscountAmount(),
                breakdown.couponDiscountAmount(),
                breakdown.discountCapApplied(),
                breakdown.totalDiscountAmount(),
                breakdown.effectiveDiscountPercentage(),
                breakdown.totalToPay()
        );
    }

    private Order buildOrder(DiscountBreakdown breakdown, Coupon coupon) {
        Order order = new Order();
        order.setCreatedAt(LocalDateTime.now());
        order.setSubtotalOriginal(breakdown.subtotalOriginal());
        order.setCategoryDiscountAmount(breakdown.categoryDiscountAmount());
        order.setVolumeDiscountAmount(breakdown.volumeDiscountAmount());
        order.setCouponDiscountAmount(breakdown.couponDiscountAmount());
        order.setDiscountCapApplied(breakdown.discountCapApplied());
        order.setTotalDiscountAmount(breakdown.totalDiscountAmount());
        order.setEffectiveDiscountPercentage(breakdown.effectiveDiscountPercentage());
        order.setTotalToPay(breakdown.totalToPay());
        order.setCoupon(coupon);
        return order;
    }

    private OrderItem buildOrderItem(Order order, Product product, CartItem cartItem) {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setProductNameSnapshot(product.getName());
        item.setUnitPriceSnapshot(product.getUnitPrice());
        item.setCategorySnapshot(cartItem.category());
        item.setQuantity(cartItem.quantity());
        item.setLineSubtotal(cartItem.lineSubtotal());
        item.setLineDiscountAmount(BigDecimal.ZERO);
        return item;
    }
}
