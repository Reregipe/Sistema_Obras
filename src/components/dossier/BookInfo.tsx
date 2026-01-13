import React from "react";

const BookInfo = ({ acionamento }: { acionamento: any }) => (
  <div>
    <div>Anexo: {acionamento?.book_email_anexo_name || "-"}</div>
    <div>Mensagem: {acionamento?.book_email_msg_name || "-"}</div>
  </div>
);

export { BookInfo };
export default BookInfo;
