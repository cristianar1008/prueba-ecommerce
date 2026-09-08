package org.ecommerce.backend.domain.discount;

import org.ecommerce.backend.domain.model.DiscountBreakdown;
import org.ecommerce.backend.domain.model.DiscountContext;

import java.util.List;

public class DiscountChain {

    private final List<DiscountRule> rules;

    public DiscountChain(List<DiscountRule> rules) {
        this.rules = List.copyOf(rules);
    }

    public DiscountBreakdown execute(DiscountContext context) {
        for (DiscountRule rule : rules) {
            rule.apply(context);
        }
        return context.toBreakdown();
    }
}
