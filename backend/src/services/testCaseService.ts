import { TestCase, CreateTestCaseRequest, UpdateTestCaseRequest } from '@/types/testCase';

export class TestCaseService {
  private tests: TestCase[] = [];

  async createTest(testData: CreateTestCaseRequest): Promise<TestCase> {
    const newTest: TestCase = {
      id: this.generateId(),
      ...testData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tests.push(newTest);
    return newTest;
  }

  async getAllTests(): Promise<TestCase[]> {
    return [...this.tests];
  }

  async getTestById(id: string): Promise<TestCase | null> {
    return this.tests.find(test => test.id === id) || null;
  }

  async updateTest(id: string, updateData: UpdateTestCaseRequest): Promise<TestCase | null> {
    const testIndex = this.tests.findIndex(test => test.id === id);
    
    if (testIndex === -1) {
      return null;
    }

    const existingTest = this.tests[testIndex];
    const updatedTest: TestCase = {
      ...existingTest,
      ...updateData,
      updatedAt: new Date()
    };

    this.tests[testIndex] = updatedTest;
    return updatedTest;
  }

  async deleteTest(id: string): Promise<boolean> {
    const testIndex = this.tests.findIndex(test => test.id === id);
    
    if (testIndex === -1) {
      return false;
    }

    this.tests.splice(testIndex, 1);
    return true;
  }

  async runTest(id: string): Promise<TestCase | null> {
    const test = await this.getTestById(id);
    
    if (!test) {
      return null;
    }

    // Simular execução do teste
    test.status = 'running';
    test.updatedAt = new Date();

    // Simular resultado do teste
    setTimeout(() => {
      test.status = Math.random() > 0.5 ? 'passed' : 'failed';
      test.actualResult = test.status === 'passed' ? 'Teste executado com sucesso' : 'Erro na execução';
      test.updatedAt = new Date();
    }, 1000);

    return test;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
