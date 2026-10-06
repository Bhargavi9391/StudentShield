package verification_service.model;

public class PlatformVerificationResult {

    private String platform;
    private String status;
    private String url;
    private String evidence;

    public PlatformVerificationResult() {
    }

    public PlatformVerificationResult(
            String platform,
            String status,
            String url,
            String evidence) {

        this.platform = platform;
        this.status = status;
        this.url = url;
        this.evidence = evidence;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getEvidence() {
        return evidence;
    }

    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }
}