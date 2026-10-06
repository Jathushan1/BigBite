package inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

public class OrderDeductionRequestDto {

    private String orderNumber;

    @NotEmpty(message = "Order must contain at least one item for stock deduction")
    @Valid
    private List<OrderDeductionItemDto> items = new ArrayList<>();

    private String notes;

    public OrderDeductionRequestDto() {}

    public OrderDeductionRequestDto(String orderNumber, List<OrderDeductionItemDto> items, String notes) {
        this.orderNumber = orderNumber;
        this.items = items != null ? items : new ArrayList<>();
        this.notes = notes;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public List<OrderDeductionItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderDeductionItemDto> items) {
        this.items = items;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
