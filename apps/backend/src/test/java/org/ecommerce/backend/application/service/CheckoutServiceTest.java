package org.ecommerce.backend.application.service;

import org.ecommerce.backend.application.factory.DiscountChainFactory;
import org.ecommerce.backend.application.service.CheckoutService;
import org.ecommerce.backend.domain.discount.DiscountChain;
import org.ecommerce.backend.domain.discount.DiscountRule;
import org.ecommerce.backend.domain.exception.EmptyCartException;
import org.ecommerce.backend.domain.exception.InsufficientStockException;
import org.ecommerce.backend.domain.exception.ProductNotFoundException;
import org.ecommerce.backend.infrastructure.persistence.entity.Category;
import org.ecommerce.backend.infrastructure.persistence.entity.Order;
import org.ecommerce.backend.infrastructure.persistence.entity.Product;
import org.ecommerce.backend.infrastructure.persistence.repository.CouponRepository;
import org.ecommerce.backend.infrastructure.persistence.repository.OrderRepository;
import org.ecommerce.backend.infrastructure.persistence.repository.ProductRepository;
import org.ecommerce.backend.web.dto.CheckoutItemRequest;
import org.ecommerce.backend.web.dto.CheckoutRequest;
import org.ecommerce.backend.web.dto.CheckoutResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private DiscountChainFactory discountChainFactory;

    @InjectMocks
    private CheckoutService checkoutService;

    private Product laptopConStock(int stock) {
        Category tecnologia = new Category();
        tecnologia.setName("Tecnologia");

        Product product = new Product();
        product.setId(1L);
        product.setName("Laptop X1");
        product.setUnitPrice(new BigDecimal("150.00"));
        product.setStock(stock);
        product.setCategory(tecnologia);
        return product;
    }

    @Test
    void lanzaEmptyCartExceptionCuandoLaListaDeItemsEsNula() {
        CheckoutRequest request = new CheckoutRequest(null, null);

        assertThatThrownBy(() -> checkoutService.checkout(request))
                .isInstanceOf(EmptyCartException.class);

        verifyNoInteractions(productRepository, orderRepository, discountChainFactory);
    }

    @Test
    void lanzaEmptyCartExceptionCuandoLaListaDeItemsEstaVacia() {
        CheckoutRequest request = new CheckoutRequest(List.of(), null);

        assertThatThrownBy(() -> checkoutService.checkout(request))
                .isInstanceOf(EmptyCartException.class);

        verifyNoInteractions(productRepository, orderRepository, discountChainFactory);
    }

    @Test
    void lanzaProductNotFoundExceptionCuandoElProductoNoExiste() {
        when(productRepository.findWithLockById(99L)).thenReturn(Optional.empty());
        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(99L, 1)), null);

        assertThatThrownBy(() -> checkoutService.checkout(request))
                .isInstanceOf(ProductNotFoundException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void lanzaInsufficientStockExceptionCuandoLaCantidadPedidaSuperaElStock() {
        Product product = laptopConStock(1);
        when(productRepository.findWithLockById(1L)).thenReturn(Optional.of(product));

        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(1L, 5)), null);

        assertThatThrownBy(() -> checkoutService.checkout(request))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("1")
                .hasMessageContaining("5");

        // No debe llegar a persistir nada si la validacion de stock falla
        verify(productRepository, never()).saveAll(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void procesaElCheckoutYDecrementaElStockCuandoTodoEsValido() {
        Product product = laptopConStock(10);
        when(productRepository.findWithLockById(1L)).thenReturn(Optional.of(product));

        // Cadena de descuento "falsa": no aplica ningun descuento, solo cierra el contexto.
        // Asi esta prueba se enfoca en la orquestacion de CheckoutService, no en el
        // calculo de descuentos (eso ya esta cubierto por los tests de dominio).
        DiscountRule sinDescuentos = context -> context.closeWithFinalTotal(BigDecimal.ZERO, false);
        when(discountChainFactory.create()).thenReturn(new DiscountChain(List.of(sinDescuentos)));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(500L);
            return order;
        });

        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(1L, 1)), null);

        CheckoutResponse response = checkoutService.checkout(request);

        assertThat(response.orderId()).isEqualTo(500L);
        assertThat(response.subtotalOriginal()).isEqualByComparingTo("150.00");
        assertThat(response.totalToPay()).isEqualByComparingTo("150.00");
        assertThat(product.getStock()).isEqualTo(9); // 10 - 1
        verify(orderRepository).save(any(Order.class));
    }

    // ---- simulate(): mismo motor de descuentos, sin efectos secundarios ----

    @Test
    void simulateLanzaEmptyCartExceptionCuandoLaListaDeItemsEsNula() {
        CheckoutRequest request = new CheckoutRequest(null, null);

        assertThatThrownBy(() -> checkoutService.simulate(request))
                .isInstanceOf(EmptyCartException.class);

        verifyNoInteractions(productRepository, orderRepository, discountChainFactory);
    }

    @Test
    void simulateLanzaProductNotFoundExceptionCuandoElProductoNoExiste() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());
        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(99L, 1)), null);

        assertThatThrownBy(() -> checkoutService.simulate(request))
                .isInstanceOf(ProductNotFoundException.class);

        verifyNoInteractions(orderRepository);
    }

    @Test
    void simulateLanzaInsufficientStockExceptionCuandoLaCantidadPedidaSuperaElStock() {
        Product product = laptopConStock(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(1L, 5)), null);

        assertThatThrownBy(() -> checkoutService.simulate(request))
                .isInstanceOf(InsufficientStockException.class);

        verifyNoInteractions(orderRepository);
    }

    @Test
    void simulateCalculaElDesgloseSinBloquearNiDecrementarStockNiPersistirNada() {
        Product product = laptopConStock(10);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        DiscountRule sinDescuentos = context -> context.closeWithFinalTotal(BigDecimal.ZERO, false);
        when(discountChainFactory.create()).thenReturn(new DiscountChain(List.of(sinDescuentos)));

        CheckoutRequest request = new CheckoutRequest(List.of(new CheckoutItemRequest(1L, 3)), null);

        CheckoutResponse response = checkoutService.simulate(request);

        assertThat(response.orderId()).isNull();
        assertThat(response.subtotalOriginal()).isEqualByComparingTo("450.00");
        assertThat(response.totalToPay()).isEqualByComparingTo("450.00");
        assertThat(product.getStock()).isEqualTo(10); // no se toca el stock

        verify(productRepository, never()).findWithLockById(any());
        verify(productRepository, never()).saveAll(any());
        verifyNoInteractions(orderRepository);
    }
}
