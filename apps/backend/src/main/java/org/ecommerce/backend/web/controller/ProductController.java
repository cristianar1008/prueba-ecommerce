package org.ecommerce.backend.web.controller;

import org.ecommerce.backend.application.service.ProductQueryService;
import org.ecommerce.backend.web.dto.ProductResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductQueryService productQueryService;

    public ProductController(ProductQueryService productQueryService) {
        this.productQueryService = productQueryService;
    }

    @GetMapping
    public List<ProductResponse> listProducts() {
        return productQueryService.listAll();
    }
}