import React from "react";
import moment from "moment";
import {auth, store} from "./firebase";
import {v4 as uuidv4} from "uuid";
import Button from "react-bootstrap/Button";
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

        store.collection('messages').orderBy('timestamp', 'desc').limit(10).onSnapshot(snapshot => {
            let newMessages = [];
            snapshot.forEach(doc => {
                newMessages.push(doc.data());
            });

            this.setState({messages: newMessages.reverse()});
        });
    }

    render() {
        const {messages} = this.state;

        const messagesHTML = messages.map((item) => {
            if (item.completed !== true) {
                return null;
            }

            return (
                <Message key={item.id} item={item}/>
            )
        });

        const typingMessagesHTML = messages.map((item) => {
            if (item.completed) {
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
            id: uuidv4(),
            message: ''
        };
    }

    handleSubmit(event) {
        event.preventDefault();

        const {message} = this.state;
        if (!message) {
            return;
        }

        store.collection('messages').doc(this.state.id).update({
            completed: true
        })
            .catch(error => {
                console.error("Error adding document: ", error);
            });

        this.setState({id: uuidv4()});
        event.target.reset();
    }

    handleInput(event) {
        event.preventDefault();

        const message = event.target.value;

        this.setState({message: message});

        store.collection('messages').doc(this.state.id).set({
            id: this.state.id,
            timestamp: Date.now(),
            content: message,
            name: this.props.name,
            userID: this.props.userID,
        })
            .catch(error => {
                console.error("Error adding document: ", error);
            });
    }

    render() {
        return (
            <form onSubmit={e => this.handleSubmit(e)}>
                <div className="input-group">
                    <textarea className="form-control" onInput={e => this.handleInput(e)}/>
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

        store.collection('online').orderBy('name', 'desc').onSnapshot(snapshot => {
            let newMembers = [];
            snapshot.forEach(doc => {
                if ((Date.now() - doc.data().timestamp) > 30 * 1000) {
                    return null;
                }

                newMembers.push(doc.data());
            });

            this.setState({members: newMembers});
        });
    }

    updateState() {
        store.collection('online').doc(this.props.userID).set({
            timestamp: Date.now(),
            name: this.props.name,
        })
            .catch(error => {
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
        const {members} = this.state;

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
            name: catNames.random(),
            user: null
        };

        auth.onAuthStateChanged(user => {
            if (user) {
                this.setState({user: user});
            } else {
                this.setState({user: null});
            }
        });

        auth.signInAnonymously().catch(function (error) {
            console.log(error);
        });
    }

    handleInput(event) {
        event.preventDefault();

        let name = event.target.value;
        if (!name) {
            name = catNames.random();
            event.target.value = name;
        }

        this.setState({name: name})
    }

    render() {
        // wait for login
        if (!this.state.user) {
            return (
                <div>
                    Loading…
                </div>
            )
        }

        return (
            <div>
                <h3>Welcome to the cool chat, <input type="text" onChange={e => this.handleInput(e)}
                                                     defaultValue={this.state.name}/>!</h3>
                <ChatMembers name={this.state.name} userID={this.state.user.uid}/>
                <ChatLog/>
                <ChatInput name={this.state.name} userID={this.state.user.uid}/>
            </div>
        );
    }
}

export {Chat};
