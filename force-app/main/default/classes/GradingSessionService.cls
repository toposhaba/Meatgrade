public with sharing class GradingSessionService {
    @AuraEnabled
    public static Grading_Session__c saveSession(Map<String, Object> draft) {
        if (!Schema.sObjectType.Grading_Session__c.isCreateable()) {
            throw handled('You do not have access to create grading sessions.');
        }
        Grading_Session__c row = new Grading_Session__c();
        row.Species__c = textValue(draft.get('Species__c'));
        row.Carcass_Id__c = textValue(draft.get('Carcass_Id__c'));
        row.Maturity__c = textValue(draft.get('Maturity__c'));
        row.Sex_Class__c = textValue(draft.get('Sex_Class__c'));
        row.Dark_Cutter__c = draft.get('Dark_Cutter__c') == true;
        row.Marbling_Degree__c = textValue(draft.get('Marbling_Degree__c'));
        row.Estimated_Marbling_Percent__c = decimalValue(draft.get('Estimated_Marbling_Percent__c'));
        row.Lean_Pixel_Percent__c = decimalValue(draft.get('Lean_Pixel_Percent__c'));
        row.Fat_Thickness_In__c = decimalValue(draft.get('Fat_Thickness_In__c'));
        row.Ribeye_Area_Sq_In__c = decimalValue(draft.get('Ribeye_Area_Sq_In__c'));
        row.Hot_Carcass_Weight_Lb__c = decimalValue(draft.get('Hot_Carcass_Weight_Lb__c'));
        row.Kidney_Pelvic_Heart_Pct__c = decimalValue(draft.get('Kidney_Pelvic_Heart_Pct__c'));
        row.Color_Score__c = decimalValue(draft.get('Color_Score__c'));
        row.Pork_Marbling_Score__c = decimalValue(draft.get('Pork_Marbling_Score__c'));
        row.Flank_Streaking__c = textValue(draft.get('Flank_Streaking__c'));
        row.Photo_Captured__c = draft.get('Photo_Captured__c') == true;
        row.Grader_Notes__c = textValue(draft.get('Grader_Notes__c'));

        SObjectAccessDecision access = Security.stripInaccessible(
            AccessType.CREATABLE,
            new List<Grading_Session__c>{ row }
        );
        List<Grading_Session__c> clean = (List<Grading_Session__c>) access.getRecords();
        try {
            insert as user clean;
        } catch (DmlException ex) {
            throw handled(ex.getDmlMessage(0));
        }
        return [
            SELECT
                Id,
                Name,
                Carcass_Id__c,
                Species__c,
                Quality_Grade__c,
                Plant_Call__c,
                Yield_Grade__c,
                Yield_Grade_Score__c,
                Requires_Review__c,
                Review_Reason__c,
                Marbling_Degree__c,
                Graded_On__c
            FROM Grading_Session__c
            WHERE Id = :clean[0].Id
            WITH USER_MODE
            LIMIT 1
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Grading_Session__c> recentSessions() {
        return [
            SELECT
                Id,
                Name,
                Carcass_Id__c,
                Species__c,
                Quality_Grade__c,
                Plant_Call__c,
                Yield_Grade__c,
                Requires_Review__c,
                Graded_On__c,
                Marbling_Degree__c
            FROM Grading_Session__c
            WITH USER_MODE
            ORDER BY Graded_On__c DESC
            LIMIT 50
        ];
    }

    private static String textValue(Object raw) {
        return raw == null ? null : String.valueOf(raw);
    }

    private static Decimal decimalValue(Object raw) {
        if (raw == null || String.isBlank(String.valueOf(raw))) {
            return null;
        }
        try {
            return Decimal.valueOf(String.valueOf(raw));
        } catch (Exception ex) {
            return null;
        }
    }

    private static AuraHandledException handled(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);
        return ex;
    }
}
