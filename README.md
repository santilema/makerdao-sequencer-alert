\# MakerDAO Sequencer Alert System

\## Overview

This project implements an automated alert system designed to monitor specific blockchain activities related to MakerDAO's sequencer and trigger alerts based on certain conditions. It's deployed as an AWS Lambda function that executes periodically, checking for unworked jobs within a specified block window on the Ethereum blockchain. When specific conditions are met (e.g., a job hasn't been worked for the past 10 consecutive blocks), the system sends an alert to a configured Discord webhook.

\## Features

- \*\*Periodic Execution\*\*: Runs on AWS Lambda, triggered every minute by Amazon EventBridge to ensure timely monitoring without missing any relevant block information.
- \*\*Automatic Deployment\*\*: Utilizes GitHub Actions for CI/CD, automatically deploying the Lambda function to AWS whenever changes are pushed to the \`main\` branch.
- \*\*Dynamic Configuration\*\*: Environment variables such as Discord webhook URL, block window size, API keys, AWS credentials, and API URLs are configurable through the GitHub repository's environment settings, allowing for flexible and secure customization without modifying the codebase.
- \*\*Low Maintenance\*\*: Designed for minimal upkeep. As new jobs become active over time, their ABIs are automatically retrieved and saved to the \`jobsABIs\` directory. This enables the system to dynamically find the signature of work functions for new contracts without manual intervention.

\## Deployment and Configuration

\### Prerequisites

- AWS Account with access to AWS Lambda and Amazon EventBridge.
- GitHub Account for repository hosting and GitHub Actions.
- Discord webhook URL for receiving alerts.

\### Environment Variables

To customize the behavior of the Lambda function and integrate with external services, set the following environment variables in the GitHub repository settings:

- \`DISCORD_WEBHOOK\`: The webhook URL for Discord to send alert notifications.
- \`BLOCKS_WINDOW\`: The number of blocks to check for unworked jobs.
- \`RPC_URL\`: Ethereum node RPC URL for blockchain queries.
- \`SEQUENCER_ADDRESS\`: The Ethereum address of the sequencer contract to monitor.
- \`ETHERSCAN_API_KEY\`: API key for Etherscan, used for retrieving contract ABIs.
- AWS credentials (\`AWS_ACCESS_KEY_ID\`, \`AWS_SECRET_ACCESS_KEY\`, \`AWS_REGION\`) for deploying the Lambda function.

\### GitHub Actions

The \`.github/workflows/deploy.yml\` file defines the GitHub Actions workflow for CI/CD. This workflow automates the process of installing dependencies, packaging the Lambda function, and deploying it to AWS Lambda upon changes to the \`main\` branch.

\### EventBridge Trigger

The Lambda function is configured to be triggered by an Amazon EventBridge (formerly CloudWatch Events) rule with a rate of 1 minute. This ensures that the function executes periodically to monitor the blockchain and trigger alerts as necessary.

\## Maintenance

The system is designed to automatically handle the inclusion of new jobs by fetching their ABIs from Etherscan and saving them to the \`jobsABIs\` directory. This approach reduces the need for manual updates to the code or deployment process as the monitored contracts evolve over time.

\## Unit Tests

Unit tests for the project can be found in the \`tests\` folder. These tests help ensure the reliability and correctness of the alert system's functionality.
