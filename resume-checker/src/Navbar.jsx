function Navbar() {
  return (
    <nav style={{background:"#18181f",borderBottom:"1px solid #2a2a35",padding:"0 2rem",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16,fontWeight:700,color:"#a78bfa"}}>ResumeAI</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <a href="https://github.com/Bhavik1502/ai-resume-analyzer" target="_blank" rel="noreferrer" style={{fontSize:13,color:"#6b7280",textDecoration:"none"}}>GitHub</a>
        <div style={{background:"linear-gradient(90deg, #7c3aed, #2563eb)",color:"#fff",fontSize:13,fontWeight:600,padding:"6px 16px",borderRadius:8}}>Free Tool</div>
      </div>
    </nav>
  )
}

export default Navbar