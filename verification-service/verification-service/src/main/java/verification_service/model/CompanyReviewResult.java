package verification_service.model;

import java.util.ArrayList;
import java.util.List;

public class CompanyReviewResult {

    private String company;
    private String status;
    private String source;
    private String sourceUrl;
    private String rating;
    private String reviewCount;

    private List<String> positiveReviews;
    private List<String> negativeReviews;

    public CompanyReviewResult() {

        this.positiveReviews = new ArrayList<>();
        this.negativeReviews = new ArrayList<>();
    }

    public CompanyReviewResult(
            String company,
            String status,
            String source,
            String sourceUrl,
            String rating,
            String reviewCount,
            List<String> positiveReviews,
            List<String> negativeReviews) {

        this.company = company;
        this.status = status;
        this.source = source;
        this.sourceUrl = sourceUrl;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.positiveReviews = positiveReviews;
        this.negativeReviews = negativeReviews;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public String getRating() {
        return rating;
    }

    public void setRating(String rating) {
        this.rating = rating;
    }

    public String getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(String reviewCount) {
        this.reviewCount = reviewCount;
    }

    public List<String> getPositiveReviews() {
        return positiveReviews;
    }

    public void setPositiveReviews(List<String> positiveReviews) {
        this.positiveReviews = positiveReviews;
    }

    public List<String> getNegativeReviews() {
        return negativeReviews;
    }

    public void setNegativeReviews(List<String> negativeReviews) {
        this.negativeReviews = negativeReviews;
    }
}