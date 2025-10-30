export interface TestCase {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    code?: string;
    expectedResult?: string;
    actualResult?: string;
}
export interface CreateTestCaseRequest {
    name: string;
    description: string;
    code?: string;
    expectedResult?: string;
}
export interface UpdateTestCaseRequest {
    name?: string;
    description?: string;
    code?: string;
    expectedResult?: string;
    status?: TestCase['status'];
}
//# sourceMappingURL=testCase.d.ts.map