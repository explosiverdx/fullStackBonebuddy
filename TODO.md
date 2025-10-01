# TODO for Signup Flow Testing and Fixes

## Completed
- Created full-page SignUpForm component with mobile number and OTP flow.
- Created SignUpPage to render SignUpForm.
- Updated App.jsx to add /signup route.
- Updated Header.jsx SignUp button to navigate to /signup.
- Verified backend API endpoints for OTP send, verify, profile update.
- Verified route protection with JWT middleware.
- Verified UserProfile page data fetching and update functionality.

## Pending
- Change SignUp button in Header.jsx to open SignIn drawer/modal instead of navigating to /signup.
- Remove /signup route and SignUpPage component if drawer/modal is used.
- Thoroughly test the drawer/modal SignIn component for signup flow.
- Test full signup flow end-to-end including:
  - Clicking SignUp button opens drawer.
  - Enter mobile number, send OTP.
  - Enter OTP, verify.
  - New user redirected to profile form with submit/skip.
  - Returning user redirected to profile page.
- Test edge cases and error handling in signup flow.
- Test backend API endpoints with curl or Postman for all scenarios.
- Test route protection for authenticated routes.

## Next Steps
- Confirm with user if I should proceed with changing SignUp button to open drawer/modal and remove /signup route.
- Confirm if user wants thorough testing of the entire signup flow or only critical path.
- After confirmation, implement changes and perform testing.
