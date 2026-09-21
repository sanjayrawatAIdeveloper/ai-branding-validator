# AI Branding Compliance Validator

## Product Goal

Build a project-based POC that validates a public website against an
organization’s branding guidelines.

## User Flow

1. Create a project.
2. Enter organization name and website homepage URL.
3. Upload branding guidelines as PDF or import structured JSON.
4. Convert uploaded guidelines into editable structured rules.
5. Review, edit, enable, or disable rules.
6. Crawl up to 10 internal website pages.
7. Extract DOM information and computed CSS styles.
8. Validate pages against approved branding rules.
9. Calculate website, page, and element-level compliance scores.
10. Display violations, expected values, actual values, severity, and
    recommended fixes.

## Initial POC Checks

- Brand colors
- Font families
- Font sizes
- Button colors
- Button border radius
- Logo presence and dimensions
- Basic spacing
- Header consistency
- Footer consistency
- Basic accessibility

## Architecture Principle

Use deterministic validation for measurable DOM and CSS properties.

Use AI for:

- Extracting rules from PDF documents
- Converting natural-language guidelines into structured JSON
- Interpreting ambiguous branding requirements
- Explaining violations
- Recommending fixes

Do not use AI to compare simple CSS values that deterministic code can
validate.

## POC Constraints

- Project-based application
- No login or registration
- No multi-user functionality
- No subscription or billing
- Maximum 10 pages per scan
- Maximum crawl depth 2
- PDF and JSON rule sources
- Public HTTP and HTTPS websites only
- Same-domain crawling only
- No production job queue in the first version

## Future Scope

- User accounts
- Organizations and workspaces
- Team roles
- Scan history
- Larger crawl limits
- Background workers
- Subscriptions
- Advanced semantic and visual validation

## Current Technical Stack

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS 4
- ESLint

## Development Rule

Implement the application in small phases. Do not build database,
crawler, AI integration, file processing, and dashboard functionality
in a single task.
