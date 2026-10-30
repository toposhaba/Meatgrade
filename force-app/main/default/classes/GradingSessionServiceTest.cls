@IsTest
private class GradingSessionServiceTest {
    @TestSetup
    static void grantGraderAccess() {
        PermissionSet grader = [SELECT Id FROM PermissionSet WHERE Name = 'Meat_Grader' LIMIT 1];
        Integer assigned = [
            SELECT COUNT()
            FROM PermissionSetAssignment
            WHERE AssigneeId = :UserInfo.getUserId() AND PermissionSetId = :grader.Id
        ];
        if (assigned == 0) {
            insert new PermissionSetAssignment(
                AssigneeId = UserInfo.getUserId(),
                PermissionSetId = grader.Id
            );
        }
    }

    @IsTest
    static void savesTheStampedGrade() {
        Map<String, Object> draft = new Map<String, Object>{
            'Species__c' => 'Beef',
            'Carcass_Id__c' => 'SVC-1',
            'Maturity__c' => 'A',
            'Sex_Class__c' => 'Steer',
            'Marbling_Degree__c' => 'Small',
            'Dark_Cutter__c' => false,
            'Fat_Thickness_In__c' => '0.4',
            'Ribeye_Area_Sq_In__c' => '12.8',
            'Hot_Carcass_Weight_Lb__c' => '750',
            'Kidney_Pelvic_Heart_Pct__c' => '2.5',
            'Quality_Grade__c' => 'Prime'
        };
        Grading_Session__c saved = GradingSessionService.saveSession(draft);
        System.assertEquals('Choice', saved.Quality_Grade__c);
        System.assertEquals(Decimal.valueOf(2), saved.Yield_Grade__c);
        System.assertEquals(Decimal.valueOf('2.75'), saved.Yield_Grade_Score__c);
        System.assertEquals(1, GradingSessionService.recentSessions().size());
    }

    @IsTest
    static void rejectsADuplicateCarcass() {
        GradingSessionService.saveSession(new Map<String, Object>{
            'Species__c' => 'Pork',
            'Carcass_Id__c' => 'DUP-1',
            'Color_Score__c' => 4,
            'Pork_Marbling_Score__c' => 3
        });
        try {
            GradingSessionService.saveSession(new Map<String, Object>{
                'Species__c' => 'Pork',
                'Carcass_Id__c' => 'DUP-1',
                'Color_Score__c' => 4,
                'Pork_Marbling_Score__c' => 3
            });
            System.assert(false, 'A duplicate carcass should be rejected.');
        } catch (AuraHandledException ex) {
            System.assert(String.isNotBlank(ex.getMessage()));
        }
    }
}
