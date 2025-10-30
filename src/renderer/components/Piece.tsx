const pieceIcons = import.meta.glob('../../assets/pieces-basic-svg/*.svg', { import:'default', eager: true , query: '?react'});

interface PieceProps {
    type: string;
    color: string;
}

export default function Piece({type, color}:PieceProps) {
    const pieceKey = `../../assets/pieces-basic-svg/${type}-${color}.svg`;
    const Icon = pieceIcons[pieceKey] as React.FC<React.SVGProps<SVGSVGElement>>;

    return Icon ? <Icon /> : <span>Missing Icon: {type}-{color}</span>;
}