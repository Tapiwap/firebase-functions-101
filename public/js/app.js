const requestModal = document.querySelector('.new-request');
const requestLink = document.querySelector('.add-request');
const requestForm = document.querySelector('.new-request form');

// open request modal
requestLink.addEventListener('click', () => {
    requestModal.classList.add('open');
});

//close the request modal
requestModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('new-request')) {
        requestModal.classList.remove('open');
    }
});

// say hello function call
const button = document.querySelector('.call');
button.addEventListener('click', () => {
    //get function ref
    const sayHello = firebase.functions().httpsCallable('sayHello');
    sayHello({ name: 'Tapiwa' }).then(result => {
        console.log(result.data);
    });
});

//add new request
requestForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const addRequest = firebase.functions().httpsCallable('addRequest');
    addRequest({
        text: requestForm.request.value,
    }).then(() => {
        requestForm.reset();
        requestModal.classList.remove('open');
        requestForm.querySelector('.error').textContent = "";
    }).catch(error => {
        requestForm.querySelector('.error').textContent = error.message;
    });
});