const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// https request 1: Generate random number
exports.randomNumber = functions.https.onRequest((request, response) => {
    const number = Math.round(Math.random() * 100);
    response.send(number.toString());
});

// https request 2: Redirect someone to google.com
exports.toTheDojo = functions.https.onRequest((request, response) => {
    response.redirect("https://www.google.com");
});

// ############################ Callable Functions ##########################
// https Call 1: Say Hello
exports.sayHello = functions.https.onCall((data, context) => {
    const name = data.name;
    return "Hello, " + name;
});

// ############################ Triggers ##########################

// auth trigger for new user sign up
exports.newUserSignUp = functions.auth.user().onCreate((user) => {
    return admin.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        upvotedOn: [],
    });
});

// auth trigger for deletion of users
exports.userDeleted = functions.auth.user().onDelete((user) => {
    const doc = admin.firestore().collection("users").doc(user.uid);
    return doc.delete();
});

// callable function for adding toturial request
exports.addRequest = functions.https.onCall((data, context) => {
    // check if the user is authenticated
    checkAuthState(context);

    // check length of request
    if (data.text.length > 30) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Request must be no more than 30 characters long."
        );
    }

    // add requests to firestore
    return admin.firestore().collection("requests").add({
        text: data.text,
        upvotes: 0,
    });
});

// upvote function
exports.upvote = functions.https.onCall((data, context) => {
    // check if the user is authenticated
    checkAuthState(context);

    console.log(context.auth.uid);
    // get refs for user docs and request docs
    const user = admin.firestore().collection("users").doc(context.auth.uid);
    const request = admin.firestore().collection("requests").doc(data.id);

    return user.get().then((doc) => {
        // check if user hasn't already upvoted request
        console.log(doc.data());
        if (doc.data().upvotedOn.includes(data.id)) {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "You have already upvoted this request."
            );
        }

        // update user array
        return user.update({
            upvotedOn: [...doc.data().upvotedOn, data.id],
        }).then(() => {
            // update votes on the request
            return request.update({
                upvotes: admin.firestore.FieldValue.increment(1),
            });
        });
    });
});

/**
 * Check it the user has been Authenticated
 * @param {*} context Contains auth state
 */
function checkAuthState(context) {
    console.log("Checking auth state...");
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Only Authenticated Users can add requests"
        );
    }
}
