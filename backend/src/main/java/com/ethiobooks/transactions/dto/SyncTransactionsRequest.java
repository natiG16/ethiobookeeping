package com.ethiobooks.transactions.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SyncTransactionsRequest {

    @NotEmpty @Valid
    private List<TransactionRequest> transactions;
}
