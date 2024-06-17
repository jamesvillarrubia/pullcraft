# Instructions for Release-It

1. Deploying to NPM and/or Github
2. Want semantic version control
3. Want automated versioning based on commits and/or PRs
4. (Optional) Want to use PrBot for PR summaries


# Versioning Pattern in Git is Github Flow

For more information about the two options, see this [link](https://www.split.io/blog/github-flow-vs-git-flow-whats-the-difference/)

Branches act as indicators of the current state of the environment.

There is usually one long-lived history:

*  Feature1      
|                
*  (unsquashed commit)              
|                
* Develop        
│                
│  * Feature 2   
│  │             
│  *  (unsquashed commit) │             
│ /              
│/               
│                
* Staging/Main/Production        
|                
|                

Because Testing is fully automated, Develop
