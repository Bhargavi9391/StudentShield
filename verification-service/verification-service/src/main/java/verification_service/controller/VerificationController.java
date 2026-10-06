package verification_service.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import verification_service.model.VerificationRequest;
import verification_service.model.VerificationResponse;
import verification_service.service.VerificationService;

@RestController
@RequestMapping("/api/verification")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(
            VerificationService verificationService) {

        this.verificationService = verificationService;
    }

    @PostMapping("/check")
    public VerificationResponse verify(
            @RequestBody VerificationRequest request) {

        return verificationService.verify(request);
    }
}