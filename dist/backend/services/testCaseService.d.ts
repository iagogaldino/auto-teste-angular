import { TestCase, CreateTestCaseRequest, UpdateTestCaseRequest } from '../types/testCase';
export declare class TestCaseService {
    private tests;
    createTest(testData: CreateTestCaseRequest): Promise<TestCase>;
    getAllTests(): Promise<TestCase[]>;
    getTestById(id: string): Promise<TestCase | null>;
    updateTest(id: string, updateData: UpdateTestCaseRequest): Promise<TestCase | null>;
    deleteTest(id: string): Promise<boolean>;
    runTest(id: string): Promise<TestCase | null>;
    private generateId;
}
//# sourceMappingURL=testCaseService.d.ts.map