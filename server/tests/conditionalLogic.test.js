const { shouldShowQuestion, evaluateCondition } = require('../utils/conditionalLogic');

describe('evaluateCondition', () => {
    describe('equals operator', () => {
        test('returns true when string values match', () => {
            const condition = { questionKey: 'role', operator: 'equals', value: 'Engineer' };
            const answers = { role: 'Engineer' };
            expect(evaluateCondition(condition, answers)).toBe(true);
        });

        test('returns false when string values do not match', () => {
            const condition = { questionKey: 'role', operator: 'equals', value: 'Engineer' };
            const answers = { role: 'Designer' };
            expect(evaluateCondition(condition, answers)).toBe(false);
        });

        test('returns true when array contains the value', () => {
            const condition = { questionKey: 'skills', operator: 'equals', value: 'JavaScript' };
            const answers = { skills: ['JavaScript', 'Python'] };
            expect(evaluateCondition(condition, answers)).toBe(true);
        });

        test('returns false when array does not contain the value', () => {
            const condition = { questionKey: 'skills', operator: 'equals', value: 'Ruby' };
            const answers = { skills: ['JavaScript', 'Python'] };
            expect(evaluateCondition(condition, answers)).toBe(false);
        });

        test('returns false when answer is missing', () => {
            const condition = { questionKey: 'role', operator: 'equals', value: 'Engineer' };
            const answers = {};
            expect(evaluateCondition(condition, answers)).toBe(false);
        });
    });

    describe('notEquals operator', () => {
        test('returns true when values do not match', () => {
            const condition = { questionKey: 'role', operator: 'notEquals', value: 'Engineer' };
            const answers = { role: 'Designer' };
            expect(evaluateCondition(condition, answers)).toBe(true);
        });

        test('returns false when values match', () => {
            const condition = { questionKey: 'role', operator: 'notEquals', value: 'Engineer' };
            const answers = { role: 'Engineer' };
            expect(evaluateCondition(condition, answers)).toBe(false);
        });

        test('returns true when answer is missing', () => {
            const condition = { questionKey: 'role', operator: 'notEquals', value: 'Engineer' };
            const answers = {};
            expect(evaluateCondition(condition, answers)).toBe(true);
        });
    });

    describe('contains operator', () => {
        test('returns true when string contains value (case-insensitive)', () => {
            const condition = { questionKey: 'bio', operator: 'contains', value: 'developer' };
            const answers = { bio: 'I am a Software Developer' };
            expect(evaluateCondition(condition, answers)).toBe(true);
        });

        test('returns false when string does not contain value', () => {
            const condition = { questionKey: 'bio', operator: 'contains', value: 'developer' };
            const answers = { bio: 'I am a designer' };
            expect(evaluateCondition(condition, answers)).toBe(false);
        });

        test('returns true when array item contains value', () => {
            const condition = { questionKey: 'tags', operator: 'contains', value: 'script' };
            const answers = { tags: ['JavaScript', 'TypeScript'] };
            expect(evaluateCondition(condition, answers)).toBe(true);
        });

        test('returns false when answer is missing', () => {
            const condition = { questionKey: 'bio', operator: 'contains', value: 'developer' };
            const answers = {};
            expect(evaluateCondition(condition, answers)).toBe(false);
        });
    });
});

describe('shouldShowQuestion', () => {
    test('returns true when rules is null', () => {
        expect(shouldShowQuestion(null, {})).toBe(true);
    });

    test('returns true when rules is undefined', () => {
        expect(shouldShowQuestion(undefined, {})).toBe(true);
    });

    test('returns true when conditions array is empty', () => {
        const rules = { logic: 'AND', conditions: [] };
        expect(shouldShowQuestion(rules, {})).toBe(true);
    });

    test('returns true when answersSoFar is undefined', () => {
        expect(shouldShowQuestion(null, undefined)).toBe(true);
    });

    describe('AND logic', () => {
        test('returns true when all conditions are met', () => {
            const rules = {
                logic: 'AND',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'experience', operator: 'equals', value: 'Senior' }
                ]
            };
            const answers = { role: 'Engineer', experience: 'Senior' };
            expect(shouldShowQuestion(rules, answers)).toBe(true);
        });

        test('returns false when one condition is not met', () => {
            const rules = {
                logic: 'AND',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'experience', operator: 'equals', value: 'Senior' }
                ]
            };
            const answers = { role: 'Engineer', experience: 'Junior' };
            expect(shouldShowQuestion(rules, answers)).toBe(false);
        });

        test('returns false when all conditions are not met', () => {
            const rules = {
                logic: 'AND',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'experience', operator: 'equals', value: 'Senior' }
                ]
            };
            const answers = { role: 'Designer', experience: 'Junior' };
            expect(shouldShowQuestion(rules, answers)).toBe(false);
        });
    });

    describe('OR logic', () => {
        test('returns true when at least one condition is met', () => {
            const rules = {
                logic: 'OR',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'role', operator: 'equals', value: 'Developer' }
                ]
            };
            const answers = { role: 'Developer' };
            expect(shouldShowQuestion(rules, answers)).toBe(true);
        });

        test('returns false when no conditions are met', () => {
            const rules = {
                logic: 'OR',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'role', operator: 'equals', value: 'Developer' }
                ]
            };
            const answers = { role: 'Designer' };
            expect(shouldShowQuestion(rules, answers)).toBe(false);
        });

        test('returns true when all conditions are met', () => {
            const rules = {
                logic: 'OR',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'department', operator: 'equals', value: 'Tech' }
                ]
            };
            const answers = { role: 'Engineer', department: 'Tech' };
            expect(shouldShowQuestion(rules, answers)).toBe(true);
        });
    });

    describe('complex scenarios', () => {
        test('Show githubUrl only if role = Engineer (from spec)', () => {
            const rules = {
                logic: 'AND',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' }
                ]
            };

            // Should show for Engineer
            expect(shouldShowQuestion(rules, { role: 'Engineer' })).toBe(true);

            // Should not show for other roles
            expect(shouldShowQuestion(rules, { role: 'Designer' })).toBe(false);
            expect(shouldShowQuestion(rules, { role: 'Manager' })).toBe(false);
            expect(shouldShowQuestion(rules, {})).toBe(false);
        });

        test('defaults to AND when logic is not specified', () => {
            const rules = {
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'level', operator: 'equals', value: 'Senior' }
                ]
            };
            const answers = { role: 'Engineer', level: 'Junior' };
            expect(shouldShowQuestion(rules, answers)).toBe(false);
        });

        test('handles mixed operators', () => {
            const rules = {
                logic: 'AND',
                conditions: [
                    { questionKey: 'role', operator: 'equals', value: 'Engineer' },
                    { questionKey: 'bio', operator: 'contains', value: 'developer' },
                    { questionKey: 'department', operator: 'notEquals', value: 'Sales' }
                ]
            };
            const answers = {
                role: 'Engineer',
                bio: 'Experienced software developer',
                department: 'Engineering'
            };
            expect(shouldShowQuestion(rules, answers)).toBe(true);
        });
    });
});
