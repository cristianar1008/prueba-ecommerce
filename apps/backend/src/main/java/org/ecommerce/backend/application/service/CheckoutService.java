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
import org.ecommerce.backend.infrastructure.persistence.entity.Order;
import org.ecommerce.backend.infrastructure.persistence.entity.OrderItem;
import org.ecommerce.backend.infrastructure.persistence.entity.Product;
import org.ecommerce.backend.infrastructure.persistence.repository.CouponRepository;
import org.ecommerce.backend.infrastructure.persistence.repository.OrderRepository;
import org.ecommerce.backend.infrastructure.persistence.repository.ProductRepository;
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

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CouponRepository couponRepository;
    private final DiscountChainFactory discountChainFactory;

    public CheckoutService(
            ProductRepository productRepository,
            OrderRepository orderRepository,
            CouponRepository couponRepository,
            DiscountChainFactory discountChainFactory
    ) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.couponRepository = couponRepository;
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

            if (product.getStock() < itemRequest.quantity()) {
                throw new InsufficientStockException(
                        product.getId(), itemRequest.quantity(), product.getStock());
            }

            product.setStock(product.getStock() - itemRequest.quantity());
            lockedProducts.add(product);

            cartItems.add(new CartItem(
                    product.getId(),
                    product.getName(),
                    product.getUnitPrice(),
                    itemRequest.quantity(),
                    toCategoryType(product)
            ));
        }

        productRepository.saveAll(lockedProducts);

        DiscountContext context = new DiscountContext(cartItems, request.couponCode());
        DiscountChain chain = discountChainFactory.create();
        DiscountBreakdown breakdown = chain.execute(context);

        Order order = buildOrder(breakdown, request.couponCode());
        for (int i = 0; i < cartItems.size(); i++) {
            order.getItems().add(buildOrderItem(order, lockedProducts.get(i), cartItems.get(i)));
        }

        Order savedOrder = orderRepository.save(order);

        return new CheckoutResponse(
                savedOrder.getId(),
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

    private CategoryType toCategoryType(Product product) {
        return "Tecnologia".equalsIgnoreCase(product.getCategory().getName())
                ? CategoryType.TECNOLOGIA
                : CategoryType.OTRO;
    }

    private Order buildOrder(DiscountBreakdown breakdown, String couponCode) {
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

        if (couponCode != null && !couponCode.isBlank()) {
            couponRepository.findByCodeIgnoreCase(couponCode).ifPresent(order::setCoupon);
        }

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
