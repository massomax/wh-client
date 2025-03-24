interface Props {
    message: string;
  }
  
  export default function EmptyState({ message }: Props) {
    return (
      <div className="centered hint">{message}</div>
    );
  }