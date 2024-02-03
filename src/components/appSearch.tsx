import { SearchOutlined } from "@ant-design/icons";
import { Input, message } from "antd";
import { ChangeEvent, useState } from "react";
import { appSearchReq } from "../requests";
import { useNavigate } from "react-router-dom";
const { Search } = Input;

const APP_PATH = import.meta.env.BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);

  const relogin = () =>
    navigate(`${APP_PATH}login`, {
      state: { msg: "session expired, please re-login" },
    });

  const onKeyDown = async (evt: React.KeyboardEvent) => {
    if (evt.key != "Enter" || term.trim() == "") {
      return;
    }
    try {
      setSearching(true);
      const res = await appSearchReq(term);
      setSearching(false);
      console.log("app search res: ", res);
      const code = res.data.code;
      if (code != 0) {
        code == 61 && relogin();
        throw new Error(res.data.message);
      }
    } catch (err) {
      setSearching(false);
      if (err instanceof Error) {
        console.log("profile update err: ", err.message);
        message.error(err.message);
      } else {
        message.error("Unknown error");
      }
      console.log("app search err: ", err);
    }
  };
  const onTermChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setTerm(evt.target.value);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
      <Search
        value={term}
        onChange={onTermChange}
        onKeyDown={onKeyDown}
        loading={searching}
        prefix={<SearchOutlined />}
        placeholder="Search invoiceId, customer email"
        style={{ width: "320px" }}
      />
    </div>
  );
};

export default Index;
