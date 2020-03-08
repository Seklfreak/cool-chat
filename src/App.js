import React from 'react';
import './App.css';
import {store} from "./firebase";
import { v4 as uuidv4 } from 'uuid';
import moment from "moment";

class Message extends React.Component {
    render() {
        const datetime = moment(this.props.item.timestamp);

        return (
            <p>{this.props.item.completed ? datetime.fromNow() + ': ': 'Typing… '}{this.props.item.content}</p>
        )
    }
}

class ChatLog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: []
        };

        store.collection('messages').orderBy('timestamp', 'asc').limit(100).onSnapshot(function (snapshot) {
            let newMessages = [];
            snapshot.forEach(function (doc) {
                newMessages.push(doc.data());
            });

            this.setState({messages: newMessages});
        }.bind(this));
    }

    render() {
        const messages = this.state.messages;

        const messagesHTML = messages.map((item) => {
            if (item.completed !== true) {
                return null;
            }

            return (
                <Message item={item}/>
            )
        });

        const typingMessagesHTML = messages.map((item) => {
            if (item.completed === true) {
                return null;
            }

            // do not show if pending for more than 60 seconds
            if ((Date.now() - item.timestamp) > 10*1000) {
                return null;
            }

            return (
                <Message item={item}/>
            )
        });

        return (
            <div>
                {messagesHTML}
                {typingMessagesHTML}
            </div>
        );
    }
}

class ChatInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            id: uuidv4()
        };

        this.inputRef = React.createRef();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }


    handleSubmit(event) {
        event.preventDefault();

        let message = this.inputRef.current.value;
        if (message === '') {
            return;
        }

        store.collection('messages').doc(this.state.id).update({
            completed: true
        })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });

        this.setState({id: uuidv4()});
        this.inputRef.current.value = '';
    }

    handleInput(event) {
        event.preventDefault();

        let message = this.inputRef.current.value;
        if (message === '') {
            return;
        }

        store.collection('messages').doc(this.state.id).set({
            id: this.state.id,
            timestamp: Date.now(),
            content: message
        })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <textarea onInput={this.handleInput} ref={this.inputRef}/>
                <input type="submit"/>
            </form>
        );
    }
}

class Chat extends React.Component {
    render() {
        return (
            <div>
                <ChatLog/>
                <ChatInput/>
            </div>
        );
    }
}

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Cool chat!</h1>
            </header>
            <Chat/>
        </div>
    );
}

export default App;
