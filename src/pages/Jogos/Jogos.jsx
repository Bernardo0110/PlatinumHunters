import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, PlusCircle, CheckCircle, Play } from 'lucide-react';
import { Card, InputGroup, Form, Button, Spinner } from 'react-bootstrap';
import './Jogos.css';

import { sampleGames } from '../../sample'; // Mantido para a lógica 'isGameInLibrary'

// URL da sua API mock local
const API_URL = 'http://localhost:3001';

// A função debounce manual foi removida. Usaremos useEffect.

const Jogos = () => {
  const [gamesList, setGamesList] = useState([]);
  const [mostPlayedGames, setMostPlayedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Envolvemos as funções de busca com useCallback para que sejam estáveis
  // e não causem re-execuções desnecessárias do useEffect
  const fetchGamesFromDB = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/games?_sort=rating&_order=desc`);
      const data = await response.json();

      const formattedGames = data.map(game => ({
        id: game.id,
        name: game.nome,
        image: game.backgroundimage,
        gameplayVideo: null,
      }));
      
      setGamesList(formattedGames);
      setMostPlayedGames(formattedGames.slice(0, 5));
    } catch (error) {
      console.error("Erro ao buscar jogos do db.json:", error);
    } finally {
      setLoading(false);
    }
  }, []); // Array vazio, só é criada uma vez

  const searchGamesInDB = useCallback(async (query) => {
    // Se a query estiver vazia, apenas chame a função de buscar todos
    if (query.trim() === '') {
      fetchGamesFromDB();
      return;
    }

    setLoading(true);
    try {
      // Buscar todos os jogos e filtrar do lado do cliente
      const response = await fetch(`${API_URL}/games?_sort=rating&_order=desc`);
      const data = await response.json();
      
      // Filtrar jogos que contêm o termo de busca no nome
      const filteredGames = data.filter(game => 
        game.nome.toLowerCase().includes(query.toLowerCase())
      );
      
      const formattedGames = filteredGames.map(game => ({
        id: game.id,
        name: game.nome,
        image: game.backgroundimage,
        gameplayVideo: null,
      }));
      setGamesList(formattedGames);
    } catch (error) {
      console.error("Erro ao pesquisar jogos no db.json:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchGamesFromDB]); // Depende de fetchGamesFromDB (que é estável)

  // Efeito inicial para carregar os jogos (sem alteração)
  useEffect(() => {
    fetchGamesFromDB();
  }, [fetchGamesFromDB]);

  // CORREÇÃO: Lógica de debounce usando useEffect
  useEffect(() => {
    // Se o termo de busca estiver vazio, carregamos todos os jogos
    if (searchTerm.trim() === '') {
      fetchGamesFromDB();
      return; // Saímos do efeito
    }

    // Se o termo de busca não estiver vazio, iniciamos o timer
    const handler = setTimeout(() => {
      searchGamesInDB(searchTerm);
    }, 500); // 500ms de delay

    // Função de limpeza:
    // Isso é o mais importante. O React vai chamar esta função
    // toda vez que o 'searchTerm' mudar, cancelando o timer anterior
    // antes de criar um novo.
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, searchGamesInDB, fetchGamesFromDB]); // Re-executa quando o termo ou as funções mudam

  // Handler para quando o texto na barra de pesquisa muda
  const handleSearchChange = (e) => {
    // Apenas atualiza o estado. O useEffect acima fará a "mágica".
    setSearchTerm(e.target.value);
  };
  
  // O resto das funções (fetchGameDetails, handleGameClick, etc.) continua igual.
  const fetchGameDetails = async (gameId) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`${API_URL}/games/${gameId}`);
      const data = await response.json();
      
      const description = `Plataformas: ${data.plataformas?.join(', ') || 'Não informado'}. \nGêneros: ${data.genres?.join(', ') || 'Não informado'}. \nAno de Lançamento: ${data.ano_de_lancamento || 'Não informado'}.`;

      setGameDetails({ 
        description: description,
        playtime: data.playtime, 
        rating: data.rating
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes do jogo:", error);
      setGameDetails({ description: "Não foi possível carregar a descrição." });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setGameDetails(null);
    fetchGameDetails(game.id);
  };

  const isGameInLibrary = (gameId) => {
    return sampleGames.some(libGame => String(libGame.id) === String(gameId));
  };

  const handleAddGame = (game) => {
    console.log(`Adicionando ${game.name} à biblioteca!`);
    setSelectedGame(null);
  };

  return (
    <div className="main-page container mt-5 pt-5">
      <div className="section-header mb-4">
        <h1 className="section-title text-center mb-2">Lista de Jogos</h1>
        <div className="section-line"></div>
        <p className="page-subtitle">Explore os jogos mais populares e bem avaliados do ano</p>
      </div>

      <div className="row justify-content-center mb-4">
          <div className="col-12 col-md-8">
            <InputGroup>
              <InputGroup.Text className="bg-dark border-secondary">
                <Search size={18} className="text-secondary" />
              </InputGroup.Text>
              <Form.Control
                className="bg-dark text-white border-secondary"
                placeholder="Pesquisar jogos..."
                value={searchTerm}
                onChange={handleSearchChange} // Agora só atualiza o estado
              />
            </InputGroup>
          </div>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="light" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3">A carregar...</p>
        </div>
      ) : (
        <>
          {/* A seção "Mais Populares" só aparece se não houver pesquisa */}
          {searchTerm.length === 0 && (
            <div className="most-played-section mb-5">
              <h3 className="most-played-title">Mais Populares</h3>
              <div className="most-played-container">
                {mostPlayedGames.map((game) => (
                  <div className="most-played-card" key={`mp-${game.id}`} onClick={() => handleGameClick(game)}>
                    <img src={game.image} alt={game.name} className="most-played-img" />
                    <div className="most-played-overlay">
                      <span className="most-played-name">{game.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Esta é a lista principal de jogos (resultados da busca ou todos) */}
          <div className="row mt-4">
            {gamesList.map((game) => ( 
              <div className="col-6 col-md-4 col-lg-3 mb-4" key={game.id} onClick={() => handleGameClick(game)}>
                <Card className="game-card-jogos bg-dark text-white">
                  <Card.Img src={game.image} alt={game.name} className="game-card-img" />
                  <div className="overlay-jogos">
                    <h5 className="game-title-jogos">{game.name}</h5>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {/* O Modal de Detalhes (sem alteração) */}
      {selectedGame && (
         <div className="details-modal-overlay" onClick={() => setSelectedGame(null)}>
           <div className="details-modal-body" onClick={(e) => e.stopPropagation()}>
             <div className="modal-video-container">
               <img src={selectedGame.image} alt={selectedGame.name} className="modal-video-header" />
               <div className="modal-video-overlay">
                 <h2 className="modal-title">{selectedGame.name}</h2>
               </div>
               <Button variant="dark" className="modal-close-btn" onClick={() => setSelectedGame(null)}>
                 <X size={24} />
               </Button>
             </div>
             <div className="modal-content-area">
               {detailsLoading ? (
                 <div className="text-center my-3"><Spinner animation="border" variant="light" size="sm" /></div>
               ) : (
                 <p className="modal-description" style={{ whiteSpace: 'pre-wrap' }}>
                   {gameDetails?.description}
                 </p>
               )}
               <div className="library-status-card mt-3">
                 {isGameInLibrary(selectedGame.id) ? (
                   <div className="d-flex align-items-center text-success"><CheckCircle size={20} className="me-2" /><span>Este jogo já está na sua biblioteca.</span></div>
                 ) : (
                   <div className="d-flex flex-column align-items-center">
                     <p>Gostaria de adicionar este jogo à sua biblioteca?</p>
                     <Button variant="outline-light" onClick={() => handleAddGame(selectedGame)}><PlusCircle size={18} className="me-2" />Adicionar à Biblioteca</Button>
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default Jogos;