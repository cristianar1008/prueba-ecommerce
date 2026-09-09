package org.ecommerce.backend.application.service;

import org.ecommerce.backend.infrastructure.persistence.repository.ProductRepository;
import org.ecommerce.backend.web.dto.ProductResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductQueryService {

    private final ProductRepository productRepository;

    public ProductQueryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> listAll() {
        return productRepository.findAllWithCategory().stream()
                .map(product -> new ProductResponse(
                        product.getId(),
                        product.getName(),
                        product.getUnitPrice(),
                        product.getStock(),
                        product.getCategory().getName(),
                        product.getImageUrl()
                ))
                .toList();
    }
}