// import { expect } from 'chai';
// import * as sinon from 'sinon';
// import { OctokitClient, GhClient } from '../src/githubClient';

// describe('OctokitClient', () => {
//   let octokitClient: OctokitClient;
//   let createPullStub: sinon.SinonStub;

//   beforeEach(() => {
//     octokitClient = new OctokitClient();
//     createPullStub = sinon.stub(octokitClient, 'createPull');
//   })

//   afterEach(() => {
//     sinon.restore();
//   });

//   it('should create a pull request using Octokit', async () => {
//     // Mock the behavior of OctokitClient.createPullRequest
//     octokitStub.resolves({ data: { html_url: 'http://example.com' } });

//     // Your test logic to create a pull request
//     const result = await OctokitClient.createPull('owner', 'repo', 'feature-branch', 'develop', 'PR title', 'PR body');

//     // Assert expectations
//     expect(octokitStub.calledOnce()).to.be.true;
//     expect(result.data.html_url).to.equal('http://example.com');
//   });

//   // Add more tests for other methods or scenarios
// });

// describe('GhClient', () => {
//   let ghStub;

//   beforeEach(() => {
//     ghStub = sinon.stub(GhClient.prototype, 'createPull');
//   });

//   afterEach(() => {
//     sinon.restore();
//   });

//   it('should create a pull request using gh', async () => {
//     // Mock the behavior of GhClient.createPullRequest
//     ghStub.resolves({ url: 'http://example.com' });

//     // Your test logic to create a pull request
//     const result = await GhClient.createPull('owner', 'repo', 'feature-branch', 'develop', 'PR title', 'PR body');

//     // Assert expectations
//     expect(ghStub.calledOnce()).to.be.true;
//     expect(result.url).to.equal('http://example.com');
//   });

//   // Add more tests for other methods or scenarios
// });
