import React, { useState, useEffect} from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.css";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  useEffect(() => {
    axios.get(`${url}/lists`, {
      headers: {
        authorization: `Bearer ${cookies.token}`
      }
    })
      .then((res) => {
        setLists(res.data)
        if (res.data.length > 0) {
          setSelectListId(res.data[0]?.id); // 最初のリストを選択
        }
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      })
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id
    if (typeof listId !== "undefined") {
      setSelectListId(listId)
      axios.get(`${url}/lists/${listId}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`
        }
      })
        .then((res) => {
          setTasks(res.data.tasks)
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        })
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios.get(`${url}/lists/${id}/tasks`, {
      headers: {
        authorization: `Bearer ${cookies.token}`
      }
    })
      .then((res) => {
        setTasks(res.data.tasks)
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      })
  }
  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p><Link to="/list/new">リスト新規作成</Link></p>
              <p><Link to={`/lists/${selectListId}/edit`}>選択中のリストを編集</Link></p>
            </div>
          </div>
          <ul className="list-tab" role="tablist">
            {lists.map((list, index) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={index}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectList(list.id);
                      e.preventDefault();
                    }
                    // 矢印キーの処理
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      const nextIndex = (index + 1) % lists.length;
                      const nextElement = document.querySelectorAll('.list-tab-item')[nextIndex];
                      nextElement.focus();
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const prevIndex = (index - 1 + lists.length) % lists.length;
                      const prevElement = document.querySelectorAll('.list-tab-item')[prevIndex];
                      prevElement.focus();
                    }
                  }}
                  tabIndex={0}
                  role="tab"
                  aria-selected={isActive} // 現在選択されているリスト項目を示す
                > {list.title}
                </li>
              )
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select onChange={handleIsDoneDisplayChange} className="display-select">
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks tasks={tasks} selectListId={selectListId} isDoneDisplay={isDoneDisplay} />
          </div>
        </div>
      </main>
    </div>
  )
}

// 表示するタスク
const calculateRemainingTime= (limit) =>{
  const now = new Date();
  const deadline = new Date(limit);
const remainingTime =deadline - now

if (remainingTime<0){
  return "期限切れ";
}
const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}日 ${hours}時間 ${minutes}分`;
}
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>

  if (isDoneDisplay == "done") {
    return (
      <ul>
        {tasks.filter((task) => {
          return task.done === true
        })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
                {task.title}<br />
                {task.done ? "完了" : "未完了"}
              </Link>
            </li>
          ))}
      </ul>
    )
  }

  return (
    <ul>
      {tasks.filter((task) => {
        return task.done === false
      })
        .map((task, key) => (
          <li key={key} className="task-item" >
            <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
              {task.title}<br />
              {task.done ? "完了" : "未完了"}
              <span>{task.limit
                ? new Intl.DateTimeFormat("ja-JP", {
                  timeZone: "Asia/Tokyo",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false // 24時間形式
                }).format(new Date(task.limit))
                : "未設定"}</span>
                <span>
              {task.limit ? 
                `残り時間${calculateRemainingTime(task.limit)}` 
                : "未設定"}
                </span>
            </Link>
          </li>
        ))}
    </ul>
  )
}