public with sharing class GradingSessionHandler {
    public static void applyGrades(List<Grading_Session__c> rows, Boolean stampTime) {
        for (Grading_Session__c row : rows) {
            MeatGradeCalculator.Decision decision = MeatGradeCalculator.decide(row);
            row.Quality_Grade__c = decision.qualityGrade;
            row.Plant_Call__c = decision.plantCall;
            row.Yield_Grade__c = decision.yieldGrade;
            row.Yield_Grade_Score__c = decision.yieldScore;
            row.Requires_Review__c = decision.requiresReview;
            row.Review_Reason__c = decision.reviewReason;
            if (stampTime || row.Graded_On__c == null) {
                row.Graded_On__c = System.now();
            }
        }
    }
}
