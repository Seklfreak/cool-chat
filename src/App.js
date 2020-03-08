import React from 'react';
import './App.css';
import {store} from "./firebase";
import {v4 as uuidv4} from 'uuid';
import moment from "moment";
import Button from 'react-bootstrap/Button';
import catNames from "cat-names";

class Message extends React.Component {
    render() {
        const datetime = moment(this.props.item.timestamp);

        return (
            <li className={`list-group-item ${this.props.item.completed ? '' : 'list-group-item-warning'}`}>
                {this.props.item.completed ? (<small>{datetime.fromNow()} </small>) : null}
                <b>{this.props.item.name} </b>
                {this.props.item.content}
            </li>
        )
    }
}

class ChatLog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: []
        };

        store.collection('messages').orderBy('timestamp', 'desc').limit(10).onSnapshot(function (snapshot) {
            let newMessages = [];
            snapshot.forEach(function (doc) {
                newMessages.push(doc.data());
            });

            this.setState({messages: newMessages.reverse()});
        }.bind(this));
    }

    render() {
        const { messages } = this.state;

        const messagesHTML = messages.map((item) => {
            if (item.completed !== true) {
                return null;
            }

            return (
                <Message key={item.id} item={item}/>
            )
        });

        const typingMessagesHTML = messages.map((item) => {
            if (item.completed === true) {
                return null;
            }

            // do not show if pending for more than 60 seconds
            if ((Date.now() - item.timestamp) > 10 * 1000) {
                return null;
            }

            return (
                <Message key={item.id} item={item}/>
            )
        });

        return (
            <ul className="list-group">
                {messagesHTML}
                {typingMessagesHTML}
            </ul>
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
            content: message,
            name: this.props.name,
        })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <div className="input-group">
                    <textarea className="form-control" onInput={this.handleInput} ref={this.inputRef}/>
                    <div className="input-group-append">
                        <Button type="submit">Submit</Button>
                    </div>
                </div>
            </form>
        );
    }
}

class ChatMembers extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            members: [],
        };

        this.updateState();

        store.collection('online').orderBy('name', 'desc').onSnapshot(function (snapshot) {
            let newMembers = [];
            snapshot.forEach(function (doc) {
                if ((Date.now() - doc.data().timestamp) > 30 * 1000) {
                    return null;
                }

                newMembers.push(doc.data());
            });

            this.setState({members: newMembers});
        }.bind(this));
    }

    updateState() {
        store.collection('online').doc(this.props.name).set({
            timestamp: Date.now(),
            name: this.props.name,
        })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            });
    }

    componentDidMount() {
        this.interval = setInterval(() => this.setState({time: this.updateState()}), 5 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        const { members } = this.state;

        const memberHTML = members.map((item, i) => {
            return (
                <b key={item.name}>{item.name}{i + 1 < members.length ? ', ' : ''}</b>
            )
        });

        return (
            <div>
                <p>Online right now ({members.length}): {memberHTML}</p>
            </div>
        )
    }
}

class Chat extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: catNames.random()
        };

        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();

        const name = event.target.value;
        if (name === '') {
            return;
        }

        this.setState({name: name})
    }

    render() {
        return (
            <div>
                <h3>Welcome to the cool chat, <input type="text" onChange={this.handleInput} value={this.state.name}/>!</h3>
                <ChatMembers name={this.state.name}/>
                <ChatLog/>
                <ChatInput name={this.state.name}/>
            </div>
        );
    }
}

function App() {
    return (
        <div className="App">
            <header className="App-header">
            </header>
            <Chat/>
        </div>
    );
}

export default App;
