import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/legalAssistant.module.css";
// Import all necessary images for the component
import msgIcon from "../assets/message.svg";
import sendBtn from "../assets/send.svg";
import userIcon from "../assets/user-icon.png";
import gptImgLogo from "../assets/chatgptLogo.svg";
import addLogo from "../assets/add.svg";

// Define the LegalAssistant functional component
const LegalAssistant = () => {
  // Get the navigate function from react-router-dom to handle navigation
  const navigate = useNavigate();

  // Return the JSX for the component
  return (
    <div className={styles.legalAssistant}>
      {/* Top navigation bar */}
      <div className={styles.topBar}>
        <Link to="/" className={styles.brand}>
          LegalSmiths
        </Link>
        <Link to="/login" className={styles.loginLink}>
          Logout
        </Link>
      </div>

      {/* Main container for the chat interface */}
      <div className={styles.container}>
        {/* Sidebar section */}
        <div className={styles.sidebar}>
          {/* Upper part of the sidebar */}
          <div className={styles.upperSide}>
            <div className={styles.upperSideTop}>
              {/* Logo section, currently empty */}
              <img src="" alt="" className={styles.logo} />
            </div>
            {/* Button to start a new chat */}
            <button className={styles.midBtn}>New Chat</button>
            {/* Saved queries section */}
            <div className={styles.upperSiderBottom}>
              <button className={styles.query}>
                <img src={msgIcon} alt="Query" />
                What is Programming?
              </button>
              <button className={styles.query}>
                <img src={msgIcon} alt="Query" />
                How to use as API?
              </button>
            </div>
          </div>
          {/* Button to navigate back to the previous page */}
          <button className={styles.back} onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        {/* Main chat area */}
        <div className={styles.main}>
          {/* Title of the chat assistant */}
          <div className={styles.title}>
            <h5>AI Legal Assistant</h5>
          </div>
          {/* Container for chat messages */}
          <div className={styles.chats}>
            {/* User chat message */}
            <div className={styles.chat}>
              <img className={styles.chatImg} src={userIcon} alt="User" />
              <p className={styles.txt}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque,
                dolores? Possimus enim reprehenderit expedita pariatur, ullam
                neque aliquam fuga illum.
              </p>
            </div>
            {/* Bot's response message */}
            <div className={`${styles.chat} ${styles.bot}`}>
              <img
                className={styles.chatImg}
                src={gptImgLogo}
                alt="AI Assistant"
              />
              <p className={styles.txt}>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Nostrum illo impedit sed optio error aperiam tempora itaque,
                veritatis iure, minima ipsam odit deleniti dicta neque
                voluptatibus. Nesciunt sequi officiis voluptatibus a inventore
                maxime totam perferendis praesentium blanditiis vel voluptatem
                minima sit eveniet tempora, aperiam, at amet sapiente, rerum
                impedit! Dolor, sunt. Quisquam ducimus velit, soluta animi
                tempora ea ipsum sequi nostrum, voluptatem mollitia libero
                voluptatum beatae quis. Suscipit quas mollitia obcaecati saepe
                facilis nulla voluptate repellendus a ullam placeat, numquam
                ipsum ad, eveniet vero iure veritatis eligendi eaque
                perferendis. Nisi repellendus voluptatum cumque doloremque dicta
                repudiandae aut numquam quas consequatur?
              </p>
            </div>
            {/* Another user chat message */}
            <div className={styles.chat}>
              <img className={styles.chatImg} src={userIcon} alt="User" />
              <p className={styles.txt}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque,
                dolores? Possimus enim reprehenderit expedita pariatur, ullam
                neque aliquam fuga illum.
              </p>
            </div>
            {/* Another bot's response message */}
            <div className={`${styles.chat} ${styles.bot}`}>
              <img
                className={styles.chatImg}
                src={gptImgLogo}
                alt="AI Assistant"
              />
              <p className={styles.txt}>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Nostrum illo impedit sed optio error aperiam tempora itaque,
                veritatis iure, minima ipsam odit deleniti dicta neque
                voluptatibus. Nesciunt sequi officiis voluptatibus a inventore
                maxime totam perferendis praesentium blanditiis vel voluptatem
                minima sit eveniet tempora, aperiam, at amet sapiente, rerum
                impedit! Dolor, sunt. Quisquam ducimus velit, soluta animi
                tempora ea ipsum sequi nostrum, voluptatem mollitia libero
                voluptatum beatae quis. Suscipit quas mollitia obcaecati saepe
                facilis nulla voluptate repellendus a ullam placeat, numquam
                ipsum ad, eveniet vero iure veritatis eligendi eaque
                perferendis. Nisi repellendus voluptatum cumque doloremque dicta
                repudiandae aut numquam quas consequatur?
              </p>
            </div>
          </div>
          {/* Chat input footer */}
          <div className={styles.chatFooter}>
            <div className={styles.inp}>
              <img src={addLogo} alt="Add" />
              <input type="text" placeholder="Enter a prompt here" />
              <button className={styles.send}>
                <img src={sendBtn} alt="Send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalAssistant;