# TODO: Fix User Name Display in perfilCliente.html

## Completed Tasks
- [x] Analyze the issue: User name not displaying correctly due to mismatch in Firestore query (using uid instead of correo)
- [x] Add necessary Firebase imports (collection, query, where, getDocs)
- [x] Update loadUserDataFromFirestore to query by correo instead of uid
- [x] Update updateUserNameInFirestore to query by correo and update the correct document
- [x] Test the changes to ensure user name loads and updates correctly

## Summary
The issue was that the Firestore queries were using `user.uid` to fetch/update user data, but the login process stores users by `correo` (email). This caused the wrong or no user data to be loaded. The fix involved:
- Querying Firestore by `correo` field instead of document ID
- Using localStorage data to get the correct email for queries
- Ensuring both load and update functions use the same query method
