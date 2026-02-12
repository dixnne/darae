import { User as UserIcon, BrainCircuit, Languages, Book, Globe, MessageCircle } from 'lucide-react';

const AvatarIcon = ({ name, size = 18, className = "" }) => {
  const props = { size, className };
  switch (name) {
    case "User": return <UserIcon {...props}/>;
    case "BrainCircuit": return <BrainCircuit {...props}/>;
    case "Languages": return <Languages {...props}/>;
    case "Book": return <Book {...props}/>;
    case "Globe": return <Globe {...props}/>;
    case "MessageCircle": return <MessageCircle {...props}/>;
    default: return <UserIcon {...props}/>;
  }
};

export default AvatarIcon;