trigger GradingSessionTrigger on Grading_Session__c (before insert, before update) {
    GradingSessionHandler.applyGrades(Trigger.new, Trigger.isUpdate);
}
