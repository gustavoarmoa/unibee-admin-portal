import { Button } from "antd";
import TextArea from "antd/es/input/TextArea";

const Index = () => {
  return (
    <div
      style={{
        width: "20%",
        border: "1px solid #EEE",
        borderRadius: "4px",
        marginLeft: "24px",
        padding: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "gray",
        }}
      >
        admin side note
      </div>
      <div
        style={{
          height: "70%",
          marginBottom: "18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "gray",
        }}
      >
        <div>main content</div>
        <div>side note1</div>
        <div>side note2</div>
      </div>
      <TextArea rows={4} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "48px",
        }}
      >
        <Button>Submit</Button>
      </div>
    </div>
  );
};

export default Index;
