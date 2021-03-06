// Book Constructor
function Book(title, author, isbn){
    this.title=title;
    this.author=author;
    this.isbn=isbn;
}

//UI Constructor
function UI() {}

//UI prototype functions
//Add book to list
UI.prototype.addBookToList=function(book){
    const list = document.getElementById('book-list');
    //create tr element
    const row=document.createElement('tr');
    //Insert cols
    row.innerHTML= `
    <td>${book.title}</td>
    <td>${book.author}</td>
    <td>${book.isbn}</td>
    <td><a href="#" class="delete">X<a></td>
    `;

    list.appendChild(row);
}

//Delete Book
UI.prototype.deleteBook=function(target){
    if(target.className==='delete'){
        target.parentElement.parentElement.remove();
    }
}

//Clear fields
UI.prototype.clearFields=function(){
    document.getElementById('title').value='';
    document.getElementById('author').value='';
    document.getElementById('isbn').value='';
}

//Show alert
UI.prototype.showAlert=function(msg,className){
    //Create div
    const div=document.createElement('div');
    //Add classes
    div.className=`alert ${className}`;
    //Add text
    div.appendChild(document.createTextNode(msg));
    //Get parent (when we want to insert an element- we have to insert it before a father's child)
    const container=document.querySelector('.container');
    const form=document.querySelector('#book-form');
    //Insert alert
    container.insertBefore(div, form)
    //TimeOut after 3 sec
    setTimeout(function(){
        document.querySelector('.alert').remove();
    },3000)
}

//Event Listener
document.getElementById('book-form').addEventListener('submit',function(e){
    //Get form values
    const title=document.getElementById('title').value;
          author=document.getElementById('author').value;
          isbn=document.getElementById('isbn').value;
    
    //Instantiate book
    const book= new Book(title,author,isbn);

    //Instantiate UI 
    const ui= new UI();

    //Validate
    if(title===''|| author===''||isbn===''){
        //Error alert
    ui.showAlert('Please fill in all fields', 'error');
    
    } else {
    //Add book to list
    ui.addBookToList(book);
    
    //Show success
    ui.showAlert('Book Added!', 'success')

    //Clear fields
    ui.clearFields('Please fill on all fields');
    }

    e.preventDefault();
});

//Event listener for delete
document.getElementById('book-list').addEventListener('click',function(e){
    //Instantiate the UI (In order to use its prototype methods)
    const ui=new UI();

    //Delete book
    ui.deleteBook(e.target);

    //Show alert
    ui.showAlert('Book removed!', 'success');
     
    e.preventDefault();
});