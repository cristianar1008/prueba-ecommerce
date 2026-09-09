package org.ecommerce.backend.infrastructure.persistence.repository;

import org.ecommerce.backend.infrastructure.persistence.entity.StateCoupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StateCouponRepository extends JpaRepository<StateCoupon, Long> {
    Optional<StateCoupon> findByNameIgnoreCase(String name);
}
