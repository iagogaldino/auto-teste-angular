"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCaseService = void 0;
class TestCaseService {
    constructor() {
        this.tests = [];
    }
    async createTest(testData) {
        const newTest = {
            id: this.generateId(),
            ...testData,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.tests.push(newTest);
        return newTest;
    }
    async getAllTests() {
        return [...this.tests];
    }
    async getTestById(id) {
        return this.tests.find(test => test.id === id) || null;
    }
    async updateTest(id, updateData) {
        const testIndex = this.tests.findIndex(test => test.id === id);
        if (testIndex === -1) {
            return null;
        }
        const existingTest = this.tests[testIndex];
        const updatedTest = {
            ...existingTest,
            ...updateData,
            updatedAt: new Date()
        };
        this.tests[testIndex] = updatedTest;
        return updatedTest;
    }
    async deleteTest(id) {
        const testIndex = this.tests.findIndex(test => test.id === id);
        if (testIndex === -1) {
            return false;
        }
        this.tests.splice(testIndex, 1);
        return true;
    }
    async runTest(id) {
        const test = await this.getTestById(id);
        if (!test) {
            return null;
        }
        test.status = 'running';
        test.updatedAt = new Date();
        setTimeout(() => {
            test.status = Math.random() > 0.5 ? 'passed' : 'failed';
            test.actualResult = test.status === 'passed' ? 'Teste executado com sucesso' : 'Erro na execução';
            test.updatedAt = new Date();
        }, 1000);
        return test;
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
exports.TestCaseService = TestCaseService;
//# sourceMappingURL=testCaseService.js.map