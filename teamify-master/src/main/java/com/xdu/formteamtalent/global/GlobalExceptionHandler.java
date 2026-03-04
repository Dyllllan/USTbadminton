package com.xdu.formteamtalent.global;

import com.xdu.formteamtalent.entity.RestfulResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public RestfulResponse handler(MethodArgumentNotValidException e) {
        List<ObjectError> allErrors = e.getBindingResult().getAllErrors();
        StringBuilder sb = new StringBuilder();
        for (ObjectError error : allErrors) {
            sb.append(error).append("&");
        }
        log.error("实体校验异常: {}", e.getMessage());
        return RestfulResponse.fail(400, sb.toString());
    }

    @ExceptionHandler(RuntimeException.class)
    public RestfulResponse handler(RuntimeException e) {
        log.error("运行时异常: {}", e.getMessage(), e);
        String msg = e.getMessage();
        return RestfulResponse.fail(400, msg != null && !msg.isEmpty() ? msg : "服务器内部错误，请重试");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public RestfulResponse handler(IllegalArgumentException e) {
        log.error("Assert异常: {}", e.getMessage());
        String msg = e.getMessage();
        return RestfulResponse.fail(400, msg != null && !msg.isEmpty() ? msg : "参数错误");
    }
}