import React from "react";
import { Link,useNavigate } from "react-router-dom";
import styles from "../styles/legalAssistant.module.css";
import msgIcon from "../assets/message.svg";
import sendBtn from "../assets/send.svg";
import userIcon from "../assets/user-icon.png";
import gptImgLogo from "../assets/chatgptLogo.svg";
import addLogo from "../assets/add.svg";


const LegalAssistant = () => {
  const navigate=useNavigate();
  return (
    <div className={styles.legalAssistant}>
      <div className={styles.topBar}>
        <Link to="/" className={styles.brand}>
          LegalSmiths
        </Link>
        <Link to="/login" className={styles.loginLink}>
          Logout
        </Link>
      </div>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.upperSide}>
            <div className={styles.upperSideTop}>
              <img src="" alt="" className={styles.logo} />
            </div>
            <button className={styles.midBtn}>
              New Chat
            </button>
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
            <button className={styles.back} onClick={() => navigate(-1)}>Back</button>
        </div>
        <div className={styles.main}>
          <div className={styles.title}>
          <h5>AI Legal Assistant</h5>
          </div>
          <div className={styles.chats}>
            <div className={styles.chat}>
              <img className={styles.chatImg} src={userIcon} alt="" />
              <p className={styles.txt}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque,
                dolores? Possimus enim reprehenderit expedita pariatur, ullam
                neque aliquam fuga illum.
              </p>
            </div>
            <div className={`${styles.chat} ${styles.bot}`}>
              <img className={styles.chatImg} src={gptImgLogo} alt="" />
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
            <div className={styles.chat}>
              <img className={styles.chatImg} src={userIcon} alt="" />
              <p className={styles.txt}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque,
                dolores? Possimus enim reprehenderit expedita pariatur, ullam
                neque aliquam fuga illum.
              </p>
            </div>
            <div className={`${styles.chat} ${styles.bot}`}>
              <img className={styles.chatImg} src={gptImgLogo} alt="" />
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
          <div className={styles.chatFooter}>
            <div className={styles.inp}>
              <img src={addLogo} alt="" />
              <input type="text" name="" placeholder="Enter a prompt here" />
              <button className={styles.send}>
                <img src={sendBtn} alt="" />
              </button>
            </div>
          </div>
        </div>
            </div>
      </div>
    
  );
};

export default LegalAssistant;
