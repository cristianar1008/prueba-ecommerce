package org.ecommerce.backend.infrastructure.persistence.repository;

import org.ecommerce.backend.infrastructure.persistence.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
