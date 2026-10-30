@IsTest
private class MeatGradeCalculatorTest {
    @IsTest
    static void gradesAmaturityFromTheStandardMinimums() {
        System.assertEquals('Prime', beef('Slightly Abundant', 'A').Quality_Grade__c);
        System.assertEquals('Choice', beef('Moderate', 'A').Quality_Grade__c);
        System.assertEquals('Choice', beef('Small', 'A').Quality_Grade__c);
        System.assertEquals('Select', beef('Slight', 'A').Quality_Grade__c);
        System.assertEquals('Standard', beef('Traces', 'A').Quality_Grade__c);
    }

    @IsTest
    static void keepsSelectInAmaturityAndRaisesChoiceForB() {
        System.assertEquals('Standard', beef('Slight', 'B').Quality_Grade__c);
        System.assertEquals('Standard', beef('Small', 'B').Quality_Grade__c);
        System.assertEquals('Choice', beef('Modest', 'B').Quality_Grade__c);
        Grading_Session__c borderline = beef('Slightly Abundant', 'B');
        System.assertEquals('Prime', borderline.Quality_Grade__c);
        System.assertEquals(true, borderline.Requires_Review__c);
    }

    @IsTest
    static void movesMatureCarcassesOntoTheLowerGrades() {
        System.assertEquals('Commercial', beef('Small', 'C').Quality_Grade__c);
        System.assertEquals('Utility', beef('Traces', 'C').Quality_Grade__c);
        System.assertEquals('Commercial', beef('Moderate', 'E').Quality_Grade__c);
        System.assertEquals('Utility', beef('Slight', 'E').Quality_Grade__c);
        System.assertEquals('Cutter', beef('Practically Devoid', 'E').Quality_Grade__c);
        System.assertEquals(true, beef('Modest', 'D').Requires_Review__c);
    }

    @IsTest
    static void blocksPrimeOnCowBeefAndOlderBullocks() {
        Grading_Session__c cow = base('Slightly Abundant', 'A');
        cow.Sex_Class__c = 'Cow';
        insert cow;
        cow = reload(cow.Id);
        System.assertEquals('Choice', cow.Quality_Grade__c);
        System.assert(cow.Review_Reason__c.contains('Cow beef is not eligible for Prime'));

        Grading_Session__c bullock = base('Slightly Abundant', 'B');
        bullock.Sex_Class__c = 'Bullock';
        insert bullock;
        bullock = reload(bullock.Id);
        System.assertEquals(null, bullock.Quality_Grade__c);
        System.assertEquals(true, bullock.Requires_Review__c);
    }

    @IsTest
    static void lowersEligibleGradesForADarkCutter() {
        Grading_Session__c prime = base('Slightly Abundant', 'A');
        prime.Dark_Cutter__c = true;
        insert prime;
        System.assertEquals('Choice', reload(prime.Id).Quality_Grade__c);

        Grading_Session__c choice = base('Small', 'A');
        choice.Dark_Cutter__c = true;
        insert choice;
        System.assertEquals('Select', reload(choice.Id).Quality_Grade__c);

        Grading_Session__c olderChoice = base('Modest', 'B');
        olderChoice.Dark_Cutter__c = true;
        insert olderChoice;
        System.assertEquals('Standard', reload(olderChoice.Id).Quality_Grade__c);

        Grading_Session__c standard = base('Traces', 'A');
        standard.Dark_Cutter__c = true;
        insert standard;
        Grading_Session__c saved = reload(standard.Id);
        System.assertEquals('Standard', saved.Quality_Grade__c);
        System.assertEquals(true, saved.Requires_Review__c);
    }

    @IsTest
    static void dropsTheFractionOnTheYieldGrade() {
        Grading_Session__c row = base('Small', 'A');
        row.Fat_Thickness_In__c = 0.4;
        row.Kidney_Pelvic_Heart_Pct__c = 2.5;
        row.Hot_Carcass_Weight_Lb__c = 750;
        row.Ribeye_Area_Sq_In__c = 12.8;
        insert row;
        row = reload(row.Id);
        System.assertEquals(Decimal.valueOf('2.75'), row.Yield_Grade_Score__c);
        System.assertEquals(Decimal.valueOf(2), row.Yield_Grade__c);

        Grading_Session__c mid = base('Small', 'A');
        mid.Carcass_Id__c = 'YG-338';
        mid.Fat_Thickness_In__c = 0.6;
        mid.Kidney_Pelvic_Heart_Pct__c = 2.5;
        mid.Hot_Carcass_Weight_Lb__c = 800;
        mid.Ribeye_Area_Sq_In__c = 13;
        insert mid;
        mid = reload(mid.Id);
        System.assertEquals(Decimal.valueOf('3.38'), mid.Yield_Grade_Score__c);
        System.assertEquals(Decimal.valueOf(3), mid.Yield_Grade__c);
    }

    @IsTest
    static void asksForMissingYieldFactors() {
        Grading_Session__c row = base('Small', 'A');
        row.Fat_Thickness_In__c = 0.4;
        insert row;
        row = reload(row.Id);
        System.assertEquals(null, row.Yield_Grade__c);
        System.assert(row.Review_Reason__c.contains('Yield grade needs'));
    }

    @IsTest
    static void sortsPorkAndLamb() {
        Grading_Session__c pork = new Grading_Session__c(
            Species__c = 'Pork',
            Carcass_Id__c = 'PORK-1',
            Color_Score__c = 4,
            Pork_Marbling_Score__c = 3
        );
        insert pork;
        System.assertEquals('Preferred', reload(pork.Id).Plant_Call__c);

        Grading_Session__c pale = new Grading_Session__c(
            Species__c = 'Pork',
            Carcass_Id__c = 'PORK-2',
            Color_Score__c = 1,
            Pork_Marbling_Score__c = 3
        );
        insert pale;
        System.assertEquals('Review', reload(pale.Id).Plant_Call__c);

        System.assertEquals('Prime sort', lamb('Modest').Plant_Call__c);
        System.assertEquals('Choice sort', lamb('Small').Plant_Call__c);
        System.assertEquals('Good sort', lamb('Slight').Plant_Call__c);
        System.assertEquals('Utility sort', lamb('Traces').Plant_Call__c);
    }

    @IsTest
    static void overwritesAClientSuppliedGrade() {
        Grading_Session__c row = base('Small', 'A');
        row.Quality_Grade__c = 'Prime';
        insert row;
        System.assertEquals('Choice', reload(row.Id).Quality_Grade__c);
    }

    @IsTest
    static void gradesABulkInsert() {
        List<Grading_Session__c> rows = new List<Grading_Session__c>();
        for (Integer index = 0; index < 200; index++) {
            Grading_Session__c row = base('Small', 'A');
            row.Carcass_Id__c = 'BULK-' + index;
            rows.add(row);
        }
        insert rows;
        Integer choices = [SELECT COUNT() FROM Grading_Session__c WHERE Carcass_Id__c LIKE 'BULK-%' AND Quality_Grade__c = 'Choice'];
        System.assertEquals(200, choices);
    }

    private static Grading_Session__c beef(String degree, String maturity) {
        Grading_Session__c row = base(degree, maturity);
        row.Carcass_Id__c = degree + '-' + maturity + '-' + String.valueOf(Crypto.getRandomInteger());
        insert row;
        return reload(row.Id);
    }

    private static Grading_Session__c base(String degree, String maturity) {
        return new Grading_Session__c(
            Species__c = 'Beef',
            Carcass_Id__c = 'BEEF-' + String.valueOf(Crypto.getRandomInteger()),
            Maturity__c = maturity,
            Sex_Class__c = 'Steer',
            Marbling_Degree__c = degree
        );
    }

    private static Grading_Session__c lamb(String streaking) {
        Grading_Session__c row = new Grading_Session__c(
            Species__c = 'Lamb',
            Carcass_Id__c = 'LAMB-' + streaking + '-' + String.valueOf(Crypto.getRandomInteger()),
            Flank_Streaking__c = streaking
        );
        insert row;
        return reload(row.Id);
    }

    private static Grading_Session__c reload(Id recordId) {
        return [
            SELECT
                Quality_Grade__c,
                Plant_Call__c,
                Yield_Grade__c,
                Yield_Grade_Score__c,
                Requires_Review__c,
                Review_Reason__c
            FROM Grading_Session__c
            WHERE Id = :recordId
        ];
    }
}
