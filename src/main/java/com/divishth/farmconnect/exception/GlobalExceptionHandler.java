package com.divishth.farmconnect.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<String> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<String> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler({MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class})
    public ResponseEntity<String> handleMalformedRequest(Exception ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Malformed request: check parameters and JSON body");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<String> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body("Method not allowed");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<String> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleResourceNotFound(ResourceNotFoundException ex){
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<String> handleBadRequestExceptions(RuntimeException ex){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<java.util.Map<String, String>> handleValidationExceptions(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        java.util.Map<String, String> errors = new java.util.HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((org.springframework.validation.FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<String> handleConstraintViolation(jakarta.validation.ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Validation Error: " + ex.getMessage());
    }

    @ExceptionHandler(org.springframework.transaction.TransactionSystemException.class)
    public ResponseEntity<String> handleTransactionException(org.springframework.transaction.TransactionSystemException ex) {
        if (ex.getRootCause() instanceof jakarta.validation.ConstraintViolationException) {
            return handleConstraintViolation((jakarta.validation.ConstraintViolationException) ex.getRootCause());
        }
        log.error("Transaction failed", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Database error");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String rootMsg = ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage();
        if (rootMsg != null && rootMsg.contains("Duplicate entry")) {
            if (rootMsg.contains("aadhaar_no") || rootMsg.toLowerCase().contains("aadhaar")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Aadhaar number is already registered. Please use a different Aadhaar number.");
            }
            if (rootMsg.contains("pan_no") || rootMsg.toLowerCase().contains("pan")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("PAN number is already registered. Please use a different PAN number.");
            }
            if (rootMsg.contains("phone_number") || rootMsg.toLowerCase().contains("phone")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Phone number is already registered. Please use a different phone number.");
            }
            if (rootMsg.contains("email")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Email is already registered. Please login or use a different email.");
            }
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A record with these details already exists.");
        }
        if (rootMsg != null && (rootMsg.contains("foreign key constraint fails") || rootMsg.contains("Cannot delete or update a parent row"))) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete this record because other records depend on it. Remove the dependent records first.");
        }
        log.error("Data integrity violation", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Database error");
    }

    // Log the details server-side; don't leak internals to the client
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
    }
}
