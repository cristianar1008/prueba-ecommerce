package org.ecommerce.backend.infrastructure.persistence.repository;

import org.ecommerce.backend.infrastructure.persistence.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface DiscountRepository extends JpaRepository<Discount, Long> {

    @Query("""
            SELECT d FROM Discount d
            WHERE LOWER(d.category.name) = LOWER(:categoryName)
              AND d.active = true
              AND (d.validFrom IS NULL OR d.validFrom <= :now)
              AND (d.validTo IS NULL OR d.validTo >= :now)
            """)
    Optional<Discount> findActiveDiscount(String categoryName, LocalDateTime now);
}
