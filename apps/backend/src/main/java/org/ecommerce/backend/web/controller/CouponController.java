package org.ecommerce.backend.web.controller;

import org.ecommerce.backend.application.service.CouponQueryService;
import org.ecommerce.backend.web.dto.CouponValidationResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponQueryService couponQueryService;

    public CouponController(CouponQueryService couponQueryService) {
        this.couponQueryService = couponQueryService;
    }

    @GetMapping("/{code}")
    public CouponValidationResponse validate(@PathVariable String code) {
        return couponQueryService.validate(code);
    }
}
