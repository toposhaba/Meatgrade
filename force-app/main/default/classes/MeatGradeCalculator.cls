public with sharing class MeatGradeCalculator {
    public static final List<String> DEGREES = new List<String>{
        'Practically Devoid',
        'Traces',
        'Slight',
        'Small',
        'Modest',
        'Moderate',
        'Slightly Abundant',
        'Moderately Abundant',
        'Abundant',
        'Very Abundant'
    };

    public class Decision {
        public String qualityGrade;
        public String plantCall;
        public Integer yieldGrade;
        public Decimal yieldScore;
        public Boolean requiresReview;
        public String reviewReason;
    }

    public static Decision decide(Grading_Session__c row) {
        List<String> review = new List<String>();
        Decision decision = new Decision();
        if (row.Species__c == 'Beef') {
            gradeBeef(row, decision, review);
            beefYield(row, decision, review);
        } else if (row.Species__c == 'Pork') {
            gradePork(row, decision, review);
        } else if (row.Species__c == 'Lamb') {
            gradeLamb(row, decision, review);
        } else {
            review.add('Choose a species.');
        }
        decision.requiresReview = !review.isEmpty();
        decision.reviewReason = String.join(review, ' ');
        return decision;
    }

    private static void gradeBeef(Grading_Session__c row, Decision decision, List<String> review) {
        if (String.isBlank(row.Marbling_Degree__c)) {
            review.add('Enter a marbling degree.');
            return;
        }
        if (!new Set<String>{ 'A', 'B', 'C', 'D', 'E' }.contains(row.Maturity__c)) {
            review.add('Enter a maturity group.');
            return;
        }
        if (row.Sex_Class__c == 'Bullock' && row.Maturity__c != 'A') {
            review.add('Bullock beef is quality graded only in A maturity.');
            return;
        }

        decision.qualityGrade = beefGradeFor(row.Marbling_Degree__c, row.Maturity__c);
        if (row.Maturity__c == 'B' && row.Marbling_Degree__c == 'Slightly Abundant') {
            review.add(
                'B maturity at Slightly Abundant sits on the Prime line. A grader needs to place it inside that degree.'
            );
        }
        if (row.Maturity__c == 'D') {
            review.add(
                'D maturity is interpolated between the published groups. A grader needs to confirm it.'
            );
        }
        if (row.Sex_Class__c == 'Cow' && decision.qualityGrade == 'Prime') {
            decision.qualityGrade = 'Choice';
            review.add('Cow beef is not eligible for Prime. The grade was set to Choice.');
        }
        if (row.Dark_Cutter__c == true && decision.qualityGrade != null) {
            if (
                decision.qualityGrade == 'Prime' ||
                decision.qualityGrade == 'Choice' ||
                decision.qualityGrade == 'Select'
            ) {
                decision.qualityGrade = lowerFullGrade(decision.qualityGrade, row.Maturity__c);
                review.add('Dark cutter lowered an eligible grade by one full grade.');
            } else if (decision.qualityGrade == 'Standard' || decision.qualityGrade == 'Commercial') {
                review.add(
                    'Dark cutter can lower this grade by as much as half a grade. A grader needs to finish the call.'
                );
            }
        }
    }

    private static String beefGradeFor(String degree, String maturity) {
        if (maturity == 'A') {
            if (degreeAtLeast(degree, 'Slightly Abundant')) return 'Prime';
            if (degreeAtLeast(degree, 'Small')) return 'Choice';
            if (degreeAtLeast(degree, 'Slight')) return 'Select';
            if (degreeAtLeast(degree, 'Practically Devoid')) return 'Standard';
            return 'Utility';
        }
        if (maturity == 'B') {
            if (degreeAtLeast(degree, 'Slightly Abundant')) return 'Prime';
            if (degreeAtLeast(degree, 'Modest')) return 'Choice';
            if (degreeAtLeast(degree, 'Practically Devoid')) return 'Standard';
            return 'Utility';
        }
        if (maturity == 'C') {
            if (degreeAtLeast(degree, 'Small')) return 'Commercial';
            if (degreeAtLeast(degree, 'Practically Devoid')) return 'Utility';
            return 'Cutter';
        }
        if (maturity == 'D') {
            if (degreeAtLeast(degree, 'Modest')) return 'Commercial';
            if (degreeAtLeast(degree, 'Traces')) return 'Utility';
            if (degreeAtLeast(degree, 'Practically Devoid')) return 'Cutter';
            return 'Canner';
        }
        if (degreeAtLeast(degree, 'Moderate')) return 'Commercial';
        if (degreeAtLeast(degree, 'Slight')) return 'Utility';
        if (degreeAtLeast(degree, 'Practically Devoid')) return 'Cutter';
        return 'Canner';
    }

    private static String lowerFullGrade(String grade, String maturity) {
        if (grade == 'Prime') return 'Choice';
        if (grade == 'Choice') return maturity == 'A' ? 'Select' : 'Standard';
        if (grade == 'Select') return 'Standard';
        return grade;
    }

    private static void beefYield(Grading_Session__c row, Decision decision, List<String> review) {
        Decimal fat = row.Fat_Thickness_In__c;
        Decimal rea = row.Ribeye_Area_Sq_In__c;
        Decimal hcw = row.Hot_Carcass_Weight_Lb__c;
        Decimal kph = row.Kidney_Pelvic_Heart_Pct__c;
        Integer present = 0;
        if (fat != null) present++;
        if (rea != null) present++;
        if (hcw != null) present++;
        if (kph != null) present++;
        if (present == 0) {
            return;
        }
        if (present < 4) {
            review.add(
                'Yield grade needs fat thickness, ribeye area, hot carcass weight, and kidney, pelvic, and heart fat.'
            );
            return;
        }
        if (fat < 0 || fat > 2 || rea < 4 || rea > 30 || hcw < 200 || hcw > 1500 || kph < 0 || kph > 10) {
            review.add('A yield measurement is outside the range this chart will score.');
            return;
        }
        Decimal raw =
            Decimal.valueOf('2.50') +
            (Decimal.valueOf('2.50') * fat) +
            (Decimal.valueOf('0.20') * kph) +
            (Decimal.valueOf('0.0038') * hcw) -
            (Decimal.valueOf('0.32') * rea);
        Integer groupValue = raw.setScale(0, System.RoundingMode.DOWN).intValue();
        decision.yieldGrade = Math.max(1, Math.min(5, groupValue));
        decision.yieldScore = raw.setScale(2, System.RoundingMode.HALF_UP);
    }

    private static void gradePork(Grading_Session__c row, Decision decision, List<String> review) {
        if (row.Color_Score__c == null || row.Pork_Marbling_Score__c == null) {
            review.add('Enter color and marbling scores.');
            return;
        }
        if (
            row.Color_Score__c < 1 ||
            row.Color_Score__c > 6 ||
            row.Pork_Marbling_Score__c < 1 ||
            row.Pork_Marbling_Score__c > 10
        ) {
            review.add('Pork scores stay between color 1 to 6 and marbling 1 to 10.');
            return;
        }
        Boolean preferred =
            row.Color_Score__c >= 3 &&
            row.Color_Score__c <= 5 &&
            row.Pork_Marbling_Score__c >= 2;
        decision.plantCall = preferred ? 'Preferred' : 'Review';
        if (!preferred) {
            review.add('Pork color or marbling is outside the preferred sort.');
        }
    }

    private static void gradeLamb(Grading_Session__c row, Decision decision, List<String> review) {
        if (String.isBlank(row.Flank_Streaking__c)) {
            review.add('Enter flank streaking.');
            return;
        }
        if (degreeAtLeast(row.Flank_Streaking__c, 'Modest')) {
            decision.plantCall = 'Prime sort';
            return;
        }
        if (degreeAtLeast(row.Flank_Streaking__c, 'Small')) {
            decision.plantCall = 'Choice sort';
            return;
        }
        if (degreeAtLeast(row.Flank_Streaking__c, 'Slight')) {
            decision.plantCall = 'Good sort';
            return;
        }
        decision.plantCall = 'Utility sort';
        review.add('Lamb flank streaking is below the Good sort.');
    }

    private static Boolean degreeAtLeast(String degree, String minimum) {
        Integer left = DEGREES.indexOf(degree);
        Integer right = DEGREES.indexOf(minimum);
        return left >= 0 && right >= 0 && left >= right;
    }
}
