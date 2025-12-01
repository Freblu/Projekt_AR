import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import './Scene.css';
import ReactQRCode from "react-qr-code";
import { jwtDecode } from 'jwt-decode';
const APP_URL = import.meta.env.VITE_API_URL;
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';


const Scene = () => {
  const mountRef = useRef(null);
  const selectedAtomIndexRef = useRef(null);
  const [elementInfo, setElementInfo] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAtom, setSelectedAtom] = useState(null);
  const [elements, setElements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [atomicRange, setAtomicRange] = useState([1, 54]);
  const atomsRef = useRef(null);
  const [viewMode, setViewMode] = useState("single");
  const singleSceneRef = useRef(null);
  const collectionSceneRef = useRef(null);
  const [atomCollection, setAtomCollection] = useState([]);
  const singleCameraRef = useRef(null);
  const collectionCameraRef = useRef(null);
  const [customAtomicNumbers, setCustomAtomicNumbers] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const atomsRefSingle = useRef(null);
  const atomsRefCollection = useRef(null);
  const [savedConfigurations, setSavedConfigurations] = useState([]);
  const [newConfigName, setNewConfigName] = useState("");
  const scaleProgressRef = useRef(0);
  const followingAtomsRef = useRef(new Set());
  const selectedBondTypeRef = useRef(-1);
  const bondCandidatesRef = useRef([]);
  const [selectedBondType, setSelectedBondType] = useState(-1);
  const bondsRef = useRef([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const bondTypes = [
    { id: 0, label: 'kowalencyjne', image: '/placeholder1.png' },
    { id: 1, label: 'jonowe', image: '/placeholder2.png' },
    { id: 2, label: 'metaliczne', image: '/placeholder3.png' },
    { id: 3, label: 'wodorowe', image: '/placeholder4.png' }
  ];

  const categoryColors = {
    "gr-niemet": "#21f32f",
    "pu-szlach": "#970aca",
    "re-alkmet": "#f44336",
    "or-alkziem": "#ff9800",
    "aq-metal": "#2fd5c8",
    "ye-transmetal": "#f6ec25",
    "gr-halogen": "#19ad23",
    "ga-niezn": "#838383",
  };

  const ThreeJSColors = {
    "tr-gr-niemet": new THREE.Color(0.129, 0.953, 0.184),
    "tr-pu-szlach": new THREE.Color(0.592, 0.039, 0.792),
    "tr-re-alkmet": new THREE.Color(0.957, 0.263, 0.212),
    "tr-or-alkziem": new THREE.Color(1.000, 0.596, 0.000),
    "tr-aq-metal": new THREE.Color(0.184, 0.835, 0.784),
    "tr-ye-transmetal": new THREE.Color(0.965, 0.925, 0.145),
    "tr-gr-halogen": new THREE.Color(0.098, 0.678, 0.137),
    "tr-ga-niezn": new THREE.Color(0.514, 0.514, 0.514),
  };

  const symbolToAtomicNumber = {};
  elements.forEach(el => {
    symbolToAtomicNumber[el.symbol] = el.atomic_number;
  });

  const valencyMap = {};
  elements.forEach(({ symbol, valency }) => {
    valencyMap[symbol] = valency;
  });

  useEffect(() => {
    fetch(`${APP_URL}/elements`)
      .then((res) => res.json())
      .then((data) => setElements(data))
      .catch((err) => console.error("Błąd pobierania danych:", err));
  }, []);


  useEffect(() => {
    const saved = localStorage.getItem("selectedConfiguration");
    if (saved) {
      const parsed = JSON.parse(saved);
      setAtomCollection(parsed.atoms); // <- wczytaj atomy do kolekcji
      setViewMode("collection");       // <- przestaw tryb renderowania
      localStorage.removeItem("selectedConfiguration"); // wyczyść po 1 użyciu
    }
  }, []);


  useEffect(() => {

  }, []);


  const exportCollectionAsGLB = () => {
    if (!atomsRefCollection.current || !collectionSceneRef.current) {
      console.error("Brak odniesień do kolekcji.");
      return;
    }
    const groupToExport = new THREE.Group();

    // Dodaj wszystkie atomy
    atomsRefCollection.current.children.forEach(child => {
      groupToExport.add(child.clone(true)); // true = rekursywnie z materiałami
    });

    // Dodaj wszystkie wiązania
    bondsRef.current.forEach(b => {
      if (b.bondMesh) {
        groupToExport.add(b.bondMesh.clone());
      }
    });

    const exporter = new GLTFExporter();

    exporter.parse(
      groupToExport,
      (result) => {
        // Sprawdź, czy wynik to ArrayBuffer (binarny .glb), czy JSON (.gltf)
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = 'collection.glb';
          a.click();

          URL.revokeObjectURL(url);
        } else {
          // Jeśli eksportujesz jako JSON (.gltf), co raczej nie chcesz:
          const output = JSON.stringify(result, null, 2);
          const blob = new Blob([output], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `${formulaInput || 'molecule'}.glb`;
          a.click();

          URL.revokeObjectURL(url);
        }
      },
      { binary: true } // eksport jako .glb
    );
  };

  const handleSelectBond = (id) => {
    let newValue = selectedBondTypeRef.current === id ? -1 : id;
    selectedBondTypeRef.current = newValue;
    setSelectedBondType(newValue);
    console.log('Wybrano wiązanie:', selectedBondTypeRef.current);
  };

  const filteredElements = elements.filter(element => (
    (selectedCategories.length === 0 || selectedCategories.includes(element.category)) &&
    element.atomic_number >= atomicRange[0] &&
    element.atomic_number <= atomicRange[1] &&
    (element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
  ));

  const generateCollectionFromAtomicNumbers = (atomicNumbers) => {
    // 1) Budujemy "atoms" w docelowym formacie:
    const atoms = atomicNumbers.map((num, idx) => {
      const el = elements.find(e => e.atomic_number === num);
      return {
        relative_id: idx,
        atomic_number: num,
        symbol: el.symbol,
        category: el.category,
        x: idx * 7,      // rozstawienie wzdłuż osi X
        y: 0,
        z: 0,
        bonds: []        // na razie brak wiązań
      };
    });

    // 2) Ustawiamy stan:
    setAtomCollection(atoms);
    setViewMode("collection");
    setCustomAtomicNumbers(atomicNumbers);
  };

  const addToCustomCollection = (atomicNumber) => {
    //if (!customAtomicNumbers.includes(atomicNumber)) {
    const updated = [...customAtomicNumbers, atomicNumber];
    setCustomAtomicNumbers(updated);
    generateCollectionFromAtomicNumbers(updated);
    //}
  };

  const removeAtomByRelativeId = (relativeIdToRemove) => {
    // 1. Usuń z atomCollection
    setAtomCollection(prev =>
      prev.filter((atom) => atom.relative_id !== relativeIdToRemove)
    );

    // 2. Usuń z customAtomicNumbers (opcjonalne, tylko jeśli chcesz zaktualizować widok zliczenia)
    setCustomAtomicNumbers(prev => {
      // Usuwamy tylko jedno wystąpienie (pierwsze) z daną wartością
      const indexToRemove = prev.findIndex((_, i) => atomCollection[i].relative_id === relativeIdToRemove);
      if (indexToRemove !== -1) {
        const newArray = [...prev];
        newArray.splice(indexToRemove, 1);
        return newArray;
      }
      return prev;
    });

    // 3. Usuń z sceny
    const atomsToRemove = atomsRefCollection.current.children.filter(
      group => group.userData.relative_id === relativeIdToRemove
    );

    atomsToRemove.forEach(group => {
      collectionSceneRef.current.remove(group);
      atomsRefCollection.current.remove(group);

      // 4. Usuń powiązane wiązania
      bondsRef.current = bondsRef.current.filter(bond => {
        const shouldRemove = bond.atom1Id === relativeIdToRemove || bond.atom2Id === relativeIdToRemove;
        if (shouldRemove) {
          collectionSceneRef.current.remove(bond.bondMesh);
        }
        return !shouldRemove;
      });
    });
  };

  const clearCollection = () => {
    setCustomAtomicNumbers([]);
  };

  const saveCollection = () => {
    localStorage.setItem("savedCollection", JSON.stringify(customAtomicNumbers));
    alert("Kolekcja zapisana!");
  };

  const loadCollection = () => {
    const saved = localStorage.getItem("savedCollection");
    if (saved) {
      generateCollectionFromAtomicNumbers(JSON.parse(saved));
      alert("Kolekcja załadowana!");
    } else {
      alert("Brak zapisanej kolekcji");
    }
  };

  const deleteConfiguration = async (name) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Użytkownik nie jest zalogowany.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/configurations/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Nie udało się usunąć konfiguracji.");
      }

      // Jeśli OK, usuń lokalnie
      setSavedConfigurations(prev => prev.filter(conf => conf.name !== name));
      clearCollection();
    } catch (err) {
      console.error("Błąd podczas usuwania konfiguracji:", err);
      alert("Nie udało się usunąć konfiguracji.");
    }
  };

  function createBondCylinder(start, end, bondType = 0) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const distance = direction.length();
    const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const bondColors = {
      0: 0xBBBBBB, // domyślny
      1: 0xFF0000, // czerwony
      2: 0x00FF00, // zielony
      3: 0x0000FF  // niebieski
    };

    const color = bondColors[bondType] || 0xBBBBBB;

    const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, distance, 8);
    const cylinderMaterial = new THREE.MeshStandardMaterial({ color });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

    cylinder.position.copy(position);
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    return cylinder;
  }


  function redrawBonds() {
    if (!atomsRefCollection.current?.children) return;

    bondsRef.current = bondsRef.current
      .filter(b => b)
      .map(({ atom1Id, atom2Id, bondMesh, type }) => {
        collectionSceneRef.current.remove(bondMesh);
        const atom1 = atomsRefCollection.current.children.find(
          group => group.userData.relative_id === atom1Id
        );
        const atom2 = atomsRefCollection.current.children.find(
          group => group.userData.relative_id === atom2Id
        );
        if (!atom1 || !atom2) return null;

        const pos1 = new THREE.Vector3();
        const pos2 = new THREE.Vector3();
        atom1.getWorldPosition(pos1);
        atom2.getWorldPosition(pos2);

        const newBondMesh = createBondCylinder(pos1, pos2);
        collectionSceneRef.current.add(newBondMesh);
        return { atom1Id, atom2Id, bondMesh: newBondMesh, type };
      })
      .filter(Boolean);
  }
  const loadConfiguration = (config) => {
    if (!config.atoms || !Array.isArray(config.atoms)) {
      console.error("Niepoprawny format konfiguracji:", config);
      return;
    }
    const Atoms = config.atoms.map(atom => {
      const match = elements.find(e => e.atomic_number === atom.atomic_number);
      return {
        ...atom,
        symbol: match?.symbol || "X",
        category: match?.category || "unknown"
      };
    });
    setAtomCollection(Atoms);
    setCustomAtomicNumbers(Atoms.map(a => a.atomic_number));
    setViewMode("collection");
    setTimeout(() => {
      if (!atomsRefCollection.current) return;

      const groups = atomsRefCollection.current.children;

      // Wyczyść
      bondsRef.current.forEach(b => {
        if (b.bondMesh && b.bondMesh.parent) {
          b.bondMesh.parent.remove(b.bondMesh);
        }
      });
      bondsRef.current = [];

      // Stwórz
      config.atoms.forEach(atom => {
        const atom1 = groups.find(g => g.userData.relative_id === atom.relative_id);
        if (!atom1 || !atom.bonds) return;

        atom.bonds.forEach(bond => {
          const alreadyExists = bondsRef.current.some(
            b => (b.atom1Id === atom.relative_id && b.atom2Id === bond.with) ||
              (b.atom1Id === bond.with && b.atom2Id === atom.relative_id)
          );
          if (alreadyExists) return;

          const atom2 = groups.find(g => g.userData.relative_id === bond.with);
          if (!atom2) return;

          const pos1 = new THREE.Vector3();
          const pos2 = new THREE.Vector3();
          atom1.getWorldPosition(pos1);
          atom2.getWorldPosition(pos2);

          const bondMesh = createBondCylinder(pos1, pos2, bond.type);

          collectionSceneRef.current.add(bondMesh);

          bondsRef.current.push({
            atom1,
            atom2,
            bondMesh,
            atom1Id: atom.relative_id,
            atom2Id: bond.with,
            type: bond.type
          });
        });
      });
    }, 100); // krótka pauza na render
  };

  const saveCurrentConfiguration = async () => {
    console.log("🧠 saveCurrentConfiguration uruchomiona");
    if (isSaving) return;

    setIsSaving(true);
    console.log("🧠 saveCurrentConfiguration przeszło");
    if (!newConfigName.trim()) return;
    if (savedConfigurations.some(c => c.name === newConfigName)) {
      alert("Konfiguracja o takiej nazwie już istnieje!");
      return;
    }
    const token = localStorage.getItem("jwtToken");
    if (!token) { alert("Musisz być zalogowany."); return; }

    // Budowa atoms:
    const atoms = atomsRefCollection.current.children.map((group, idx) => {
      const { atomicNumber, symbol, category, relative_id } = group.userData;
      const groupId = relative_id;

      return {
        relative_id: idx,
        atomic_number: atomicNumber,
        symbol,
        category,
        x: group.position.x,
        y: group.position.y,
        z: group.position.z,
        bonds: bondsRef.current
          .filter(b =>
            b.atom1Id === groupId || b.atom2Id === groupId
          )
          .map(b => {
            const otherId = (b.atom1Id === groupId) ? b.atom2Id : b.atom1Id;
            return {
              with: otherId,
              type: b.type
            };
          })
          .filter(Boolean)
      };
    });

    console.log(bondsRef.current);
    try {
      const res = await fetch(`${APP_URL}/configurations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newConfigName.trim(),
          atoms    // ← pełne dane zamiast atomic_numbers
        })
      });

      const responseData = await res.json();

      if (!res.ok) {
        console.error("❌ Odpowiedź serwera (błąd):", responseData);
        throw new Error(responseData.message || "Nieznany błąd serwera");
      }

      console.log("✅ Odpowiedź serwera:", responseData);

      setSavedConfigurations(prev => [
        ...prev,
        { name: newConfigName.trim(), atoms }
      ]);
      setNewConfigName("");
    } catch (e) {
      console.error(e);
      alert("Błąd zapisu konfiguracji.");
    }


    // const data = await res.json(); // <-- odczytujemy odpowiedź JSON

    // if (!res.ok) throw new Error(data.message);

    // console.log(data.message);

    setIsSaving(false);
  };

  const loadUserConfigurations = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) { alert("Musisz być zalogowany."); return; }
    try {
      const res = await fetch(`${APP_URL}/configurations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const data = await res.json();

      setSavedConfigurations(
        data.map(conf => ({
          id: conf.id,
          name: conf.name,
          atoms: conf.atoms
        }))
      );
    } catch (e) {
      console.error(e);
      alert("Błąd pobierania konfiguracji.");
    }
  };

  useEffect(() => {
    loadUserConfigurations();
  }, []);
  useEffect(() => {
    if (viewMode !== "single" || !selectedAtom || !singleSceneRef.current) return;

    const atom = createAtom(selectedAtom.atomic_number, selectedAtom.symbol, selectedAtom.category);
    atomsRefSingle.current = atom;

    singleSceneRef.current.children = singleSceneRef.current.children.filter(obj => !obj.isGroup && !obj.isMesh);
    singleSceneRef.current.add(atom);

    const boundingBox = new THREE.Box3().setFromObject(atom);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    atom.position.sub(center);

    singleCameraRef.current.position.set(0, 0, 2 * boundingBox.getSize(new THREE.Vector3()).length());
    singleCameraRef.current.lookAt(0, 0, 0);
    singleCameraRef.current.updateProjectionMatrix();
  }, [selectedAtom, viewMode]);


  function parseFormula(formula) {
    const result = [];
    let i = 0;

    while (i < formula.length) {
      let symbol = formula[i];
      i++;

      if (i < formula.length && /[a-z]/.test(formula[i])) {
        symbol += formula[i];
        i++;
      }

      let numStr = "";
      while (i < formula.length && /\d/.test(formula[i])) {
        numStr += formula[i];
        i++;
      }

      const count = numStr ? parseInt(numStr, 10) : 1;
      result.push({ symbol, count });
    }

    return result;
  }

  // useEffect(() => {

  //   console.log(parseFormula("Na2Cl"));
  // }, []);


  function generateFromFormula(formula) {
    const parsed = parseFormula(formula);

    const newAtoms = [];
    let nextRelativeId = 0;

    parsed.forEach(({ symbol, count }) => {
      const atomicNumber = symbolToAtomicNumber[symbol];
      if (!atomicNumber) {
        console.warn(`Nieznany pierwiastek: ${symbol}`);
        return;
      }

      for (let i = 0; i < count; i++) {
        const el = elements.find(e => e.atomic_number === atomicNumber);
        newAtoms.push({
          relative_id: nextRelativeId++,
          atomic_number: atomicNumber,
          symbol: el.symbol,
          category: el.category,
          x: nextRelativeId * 5,
          y: 0,
          z: 0,
          bonds: []
        });
      }
    });

    bondsRef.current = [];
    setAtomCollection(newAtoms);
    setCustomAtomicNumbers(newAtoms.map(a => a.atomic_number));
    setViewMode("collection");
  }

  useEffect(() => {
    if (!mountRef.current) return;

    singleSceneRef.current = new THREE.Scene();
    collectionSceneRef.current = new THREE.Scene();
    singleCameraRef.current = new THREE.PerspectiveCamera(30, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    collectionCameraRef.current = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);

    //cameraRef.current.position.z = 5;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const addLights = (scene) => {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(3, 2, 2);
      scene.add(ambientLight);
      scene.add(directionalLight);
    };

    addLights(singleSceneRef.current);
    addLights(collectionSceneRef.current);


    if (selectedAtom && singleSceneRef.current) {
      const atom = createAtom(selectedAtom.atomic_number, selectedAtom.symbol, selectedAtom.category);
      atomsRefSingle.current = atom;
      singleSceneRef.current.children = singleSceneRef.current.children.filter(obj => !obj.isGroup && !obj.isMesh);
      singleSceneRef.current.add(atom);

      // 👉 Centrowanie i zoom kamery
      const boundingBox = new THREE.Box3().setFromObject(atom);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      atom.position.sub(center); // Wycentrowanie modelu

      singleCameraRef.current.position.set(0, 0, 2 * boundingBox.getSize(new THREE.Vector3()).length());
      singleCameraRef.current.lookAt(0, 0, 0);
      singleCameraRef.current.updateProjectionMatrix();
    }


    if (collectionSceneRef.current) {
      const group = new THREE.Group();
      atomCollection.forEach((atomData) => {
        const atom = createAtom(
          atomData.atomic_number,
          atomData.symbol,
          atomData.category
        );
        atom.userData.relative_id = atomData.relative_id;
        atom.position.set(atomData.x, atomData.y, atomData.z);
        group.add(atom);
      });
      console.log(group);
      //console.log(group.children[0].userData);

      atomsRefCollection.current = group;

      // Usuń poprzednie obiekty ze sceny kolekcji
      collectionSceneRef.current.children = collectionSceneRef.current.children.filter(obj => !obj.isGroup && !obj.isMesh);
      collectionSceneRef.current.add(group);

      // 👉 Oblicz bounding box, ustaw kamerę
      const boundingBox = new THREE.Box3().setFromObject(group);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = collectionCameraRef.current.fov * (Math.PI / 130);
      let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
      cameraZ *= 1.4; // dodaj margines

      collectionCameraRef.current.position.set(center.x, center.y, cameraZ);
      collectionCameraRef.current.lookAt(center);
      collectionCameraRef.current.updateProjectionMatrix();

    }



    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();


    const handleMouseClick = (event) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      let currentCamera = viewMode === "single" ? singleCameraRef.current : collectionCameraRef.current;
      let currentObjects = viewMode === "single" ? singleSceneRef.current.children : atomsRefCollection.current?.children || [];

      raycaster.setFromCamera(mouse, currentCamera);
      const intersects = raycaster.intersectObjects(currentObjects, true);

      if (intersects.length > 0) {
        const first = intersects[0].object;



        const atomGroup = first.parent;
        if (!atomGroup?.userData?.symbol || atomGroup.name === 'linkButton') return;

        console.log('Wybrano wiązanie:', selectedBondTypeRef.current);
        const { symbol, atomicNumber } = atomGroup.userData || {};

        if (symbol) {
          console.log(`Kliknięto atom: ${symbol}, liczba atomowa: ${atomicNumber}`);
        }
        const index = atomsRefCollection.current.children.findIndex(group => group === atomGroup);

        if (index !== -1) {
          selectedAtomIndexRef.current = index;
          scaleProgressRef.current = 0;
          console.log(`Relatywne id to : ${index}`);
        }

        if (selectedBondTypeRef.current != -1) {
          bondCandidatesRef.current.push(atomGroup);

          // Kiedy są dwa atomy — rysujemy cylinder
          if (bondCandidatesRef.current.length === 2) {
            const [atom1, atom2] = bondCandidatesRef.current;

            // 1. Pozycje do stworzenia cylinderka
            const pos1 = new THREE.Vector3();
            const pos2 = new THREE.Vector3();
            atom1.getWorldPosition(pos1);
            atom2.getWorldPosition(pos2);

            const bondMesh = createBondCylinder(pos1, pos2, selectedBondTypeRef.current);

            collectionSceneRef.current.add(bondMesh);

            // 2. Wyciągamy relatywne ID z userData
            const id1 = atom1.userData.relative_id;
            const id2 = atom2.userData.relative_id;

            // 3. Dodajemy nowy obiekt z atom1, atom2, meshem i ich relatywnymi ID
            bondsRef.current.push({
              atom1,
              atom2,
              bondMesh,
              atom1Id: id1,
              atom2Id: id2,
              type: selectedBondTypeRef.current
            });

            console.log(`Dodano wiązanie między atomami ${id1} ↔ ${id2} (type ${selectedBondTypeRef.current}).`);
            bondCandidatesRef.current = [];
          }
        } else {
          console.log("jest w else");
          if (followingAtomsRef.current.has(index)) {
            followingAtomsRef.current.delete(index);
          } else {
            followingAtomsRef.current.add(index);
          }
        }
      }
    };


    mountRef.current.addEventListener("click", handleMouseClick);

    const handleResize = () => {
      collectionCameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      collectionCameraRef.current.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    let animationId;
    function animate() {
      animationId = requestAnimationFrame(animate);

      let currentScene;
      let currentCamera;

      if (viewMode === "single") {
        currentScene = singleSceneRef.current;
        currentCamera = singleCameraRef.current;

        if (atomsRefSingle.current) {
          atomsRefSingle.current.rotation.y += 0.003;

          const orbits = atomsRefSingle.current.userData?.orbits;
          if (orbits) orbits.rotation.y += 0.01;

          // 🔁 Elektrony w ruchu (poprawnie dla pojedynczego atomu)
          atomsRefSingle.current.traverse(child => {
            if (child.userData?.isElectron) {
              child.userData.angle += child.userData.speed;
              const { angle, radius, rotation } = child.userData;

              const pos = new THREE.Vector3(
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                0
              );
              pos.applyEuler(rotation);
              child.position.copy(pos);
            }
          });

          // Skalowanie kliknięcia
          scaleProgressRef.current += 0.1;
          const scaleFactor = 1 + 0.3 * Math.sin(scaleProgressRef.current);
          atomsRefSingle.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
          if (scaleProgressRef.current >= Math.PI) {
            atomsRefSingle.current.scale.set(1, 1, 1);
          }
        }

      } else if (viewMode === "collection") {
        currentScene = collectionSceneRef.current;
        currentCamera = collectionCameraRef.current;

        if (atomsRefCollection.current?.children?.length) {
          atomsRefCollection.current.children.forEach((atomGroup, index) => {
            atomGroup.rotation.y += 0.003;

            const orbits = atomGroup?.userData?.orbits;
            if (orbits) orbits.rotation.y += 0.01;


            // 🔁 Ruch elektronów na orbicie
            atomGroup.traverse(child => {
              if (child.userData?.isElectron) {
                child.userData.angle += child.userData.speed;
                const { angle, radius, rotation } = child.userData;

                const pos = new THREE.Vector3(
                  radius * Math.cos(angle),
                  radius * Math.sin(angle),
                  0
                );
                pos.applyEuler(rotation);
                child.position.copy(pos);
              }



            });


            // Skalowanie kliknięcia
            if (index === selectedAtomIndexRef.current) {
              scaleProgressRef.current += 0.1;
              const scaleFactor = 1 + 0.3 * Math.sin(scaleProgressRef.current);
              atomGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
              if (scaleProgressRef.current >= Math.PI) {
                atomGroup.scale.set(1, 1, 1);
              }
            }
          });
        }

        // 🔁 Przerysowanie wiązań
        if (collectionSceneRef.current) {
          bondsRef.current = bondsRef.current
            .filter(b => b)
            .map(({ atom1Id, atom2Id, bondMesh, type }) => {
              collectionSceneRef.current.remove(bondMesh);

              const atom1 = atomsRefCollection.current.children.find(
                group => group.userData.relative_id === atom1Id
              );
              const atom2 = atomsRefCollection.current.children.find(
                group => group.userData.relative_id === atom2Id
              );
              if (!atom1 || !atom2) return null;

              const pos1 = new THREE.Vector3();
              const pos2 = new THREE.Vector3();
              atom1.getWorldPosition(pos1);
              atom2.getWorldPosition(pos2);

              const newBondMesh = createBondCylinder(pos1, pos2, type);

              collectionSceneRef.current.add(newBondMesh);

              return { atom1Id, atom2Id, bondMesh: newBondMesh, type };
            })
            .filter(Boolean);
        }
      }

      // 🖱 Przeciąganie
      followingAtomsRef.current.forEach(index => {
        const atomGroup = atomsRefCollection.current?.children?.[index];
        if (!atomGroup) return;

        raycaster.setFromCamera(mouse, collectionCameraRef.current);
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -atomGroup.position.z);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, intersection);

        atomGroup.position.x = intersection.x;
        atomGroup.position.y = intersection.y;
      });

      renderer.render(currentScene, currentCamera);
    }

    animate();

    return () => {
      try {
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
      } catch (e) {
        console.warn("DOM element został już usunięty:", e.message);
      }
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeEventListener("click", handleMouseClick);
      renderer.dispose();
      cancelAnimationFrame(animationId);
    };
  }, [elements, selectedAtom, atomCollection, viewMode]);


  function createAtom(atomicNumber, symbol, category) {
    const color = ThreeJSColors[`tr-${category}`];

    const geometry = new THREE.SphereGeometry(
      0.05 * Math.log(atomicNumber) + 0.5 + 0.013 * atomicNumber,
      64,
      64
    );
    const material = new THREE.MeshPhongMaterial({
      color,
      shininess: 60,
      specular: new THREE.Color(0xffffff),
    });
    const nucleus = new THREE.Mesh(geometry, material);
    nucleus.name = symbol;

    const orbits = generateElectronOrbits(atomicNumber);

    const atomGroup = new THREE.Group();
    atomGroup.add(nucleus);
    atomGroup.add(orbits);
    atomGroup.userData = {
      atomicNumber,
      symbol,
      category,
      orbits
    };

    return atomGroup;
  }

  function generateElectronOrbits(atomicNumber) {
    const group = new THREE.Group();
    const maxElectronsPerShell = [2, 8, 18, 32, 32, 18, 8];
    let remaining = atomicNumber;
    const radiusBase = 1.2;

    const shellColors = [
      0x1e90ff, // K
      0x00fa9a, // L
      0xffff00, // M
      0xffa500, // N
      0xff4500, // O
      0xda70d6, // P
      0x8b0000, // Q
    ];

    for (let i = 0; i < maxElectronsPerShell.length && remaining > 0; i++) {
      const electronsOnShell = Math.min(maxElectronsPerShell[i], remaining);
      const radius = radiusBase + i * 0.6;


      const orbitRotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Orbita jako torus
      const torusGeometry = new THREE.TorusGeometry(radius, 0.015, 8, 64);
      const torusMaterial = new THREE.MeshBasicMaterial({
        color: shellColors[i % shellColors.length],
        side: THREE.DoubleSide,
      });
      const orbit = new THREE.Mesh(torusGeometry, torusMaterial);
      orbit.rotation.copy(orbitRotation);
      group.add(orbit);

      // Elektrony
      for (let j = 0; j < electronsOnShell; j++) {
        const angle = (j / electronsOnShell) * Math.PI * 2;

        const localX = radius * Math.cos(angle);
        const localY = radius * Math.sin(angle);
        const localZ = 0;

        const pos = new THREE.Vector3(localX, localY, localZ);
        pos.applyEuler(orbitRotation); // obróć pozycję w odpowiednią płaszczyznę

        const electron = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 12, 12),
          new THREE.MeshStandardMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.7,
            emissive: 0x0033ff,
            emissiveIntensity: 0.6
          })
        );

        electron.position.copy(pos);

        // Glow (poświata)
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 16, 16),
          new THREE.MeshBasicMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
          })
        );
        electron.add(glow);

        // Ruch orbitalny
        electron.userData = {
          angle,
          radius,
          level: i,
          speed: 0.01 + Math.random() * 0.005,
          rotation: orbitRotation.clone()
        };

        // Efekt pulsacji (opcja)
        if (atomicNumber > 2) {
          const pulse = () => {
            const scale = 1 + Math.random() * 0.4;
            electron.scale.set(scale, scale, scale);
            setTimeout(() => {
              electron.scale.set(1, 1, 1);
            }, 300 + Math.random() * 300);
          };
          setInterval(pulse, 800 + Math.random() * 600);
        }

        electron.userData.isElectron = true;
        group.add(electron);

      }

      remaining -= electronsOnShell;
    }

    return group;
  }

  function canSaveWithValency(atomCollection, bonds) {
    const bondCount = {};

    bonds.forEach(({ atom1Id, atom2Id }) => {
      bondCount[atom1Id] = (bondCount[atom1Id] || 0) + 1;
      bondCount[atom2Id] = (bondCount[atom2Id] || 0) + 1;
    });

    return atomCollection.every(atom => {
      const expected = valencyMap[atom.symbol];
      const actual = bondCount[atom.relative_id] || 0;
      console.log(`Atom ${atom.symbol} (id ${atom.relative_id}): bonds = ${actual}, valency = ${expected}`);
      return actual >= 1 && actual <= expected;
    });
  }


  function useMobileView() {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isMobile;
  }


  const [formulaInput, setFormulaInput] = useState("");

  const isMobile = useMobileView();

  return (
    isMobile ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
          gap: "1rem",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginTop: "1rem" }}>
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <button onClick={() => setIsOptionsOpen(prev => !prev)}>
                ⚙️ {isOptionsOpen ? "Ukryj opcje konfiguracji" : "Pokaż opcje konfiguracji"}
              </button>

              {isOptionsOpen && (
                <div>
                  <h3>➕ Dodaj ręcznie numer atomowy</h3>
                  <input
                    type="number"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="np. 8"
                  />
                  <button
                    onClick={() => {
                      const num = parseInt(manualInput);
                      if (!isNaN(num)) {
                        addToCustomCollection(num);
                        setManualInput("");
                      }
                    }}
                  >
                    Dodaj
                  </button>

                  <div>
                    <input
                      type="text"
                      value={formulaInput}
                      onChange={e => setFormulaInput(e.target.value)}
                      placeholder="Wpisz wzór, np. H2O, CO2"
                    />
                    <button onClick={() => generateFromFormula(formulaInput)}>Generuj</button>
                  </div>

                  <button
                    style={{ marginLeft: "1rem" }}
                    onClick={() => generateCollectionFromAtomicNumbers(customAtomicNumbers)}
                  >
                    Utwórz kolekcję z wybranych
                  </button>

                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "400px",
                      margin: "0 auto",
                    }}
                  >
                    <h4>💾 Zapisane konfiguracje</h4>

                    <input
                      type="text"
                      placeholder="Nazwa konfiguracji"
                      value={newConfigName}
                      onChange={(e) => setNewConfigName(e.target.value)}
                    />
                    <button onClick={saveCurrentConfiguration} disabled={isSaving || !canSaveWithValency(atomCollection, bondsRef.current)}>
                      {isSaving ? "Zapisywanie..." : "Zapisz"}
                    </button>

                    <div className="valency-hints">
                      {
                        (() => {
                          const bondCount = {};
                          bondsRef.current.forEach(({ atom1Id, atom2Id }) => {
                            bondCount[atom1Id] = (bondCount[atom1Id] || 0) + 1;
                            bondCount[atom2Id] = (bondCount[atom2Id] || 0) + 1;
                          });

                          return atomCollection.map(atom => {
                            const expected = valencyMap[atom.symbol];
                            const actual = bondCount[atom.relative_id] || 0;

                            if (actual === 0) {
                              return <div key={atom.relative_id} style={{ color: 'orange' }}>
                                {atom.symbol} nie ma wiązań
                              </div>;
                            }
                            if (actual > expected) {
                              return <div key={atom.relative_id} style={{ color: 'red' }}>
                                {atom.symbol} ma za dużo wiązań ({actual} zamiast maks. {expected})
                              </div>;
                            }
                            return null;
                          });
                        })()
                      }
                    </div>

                    <details className="menu-section">
                      <summary>Zapisane konfiguracje</summary>
                      <ul style={{ marginTop: "1rem" }}>
                        {savedConfigurations.map((conf, i) => (
                          <li key={i} style={{ marginBottom: 8 }}>
                            <strong>{conf.name}</strong>
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              <button onClick={() => loadConfiguration(conf)}>Wczytaj</button>
                              <button onClick={() => deleteConfiguration(conf.name)}>Usuń</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                    <hr style={{ margin: "1rem 0" }} />

                    <h4>🧪 Obecna konfiguracja</h4>
                    <ul>
                      {atomCollection.map((atom) => (
                        <li key={atom.relative_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>Atom #{atom.atomic_number} </span>
                          <button onClick={() => removeAtomByRelativeId(atom.relative_id)}>Usuń</button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <button onClick={() => setViewMode("single")}>🔬 Pojedynczy model</button>
                    <button onClick={() => setViewMode("collection")}>🧪 Kolekcja modeli</button>
                  </div>

                  <div>
                    <div className="filters" style={{ marginBottom: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Szukaj (nazwa lub symbol)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginRight: '1rem' }}
                      />
                      <div style={{ marginRight: '1rem' }}>
                        <label>Wybierz kategorie:</label>
                        {Object.entries(categoryColors).map(([key, color]) => (
                          <div key={key}>
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(key)}
                              onChange={() =>
                                setSelectedCategories(prev =>
                                  prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
                                )
                              }
                            />
                            <span style={{ marginLeft: '8px', color }}>{key}</span>
                          </div>
                        ))}
                      </div>
                      <label style={{ marginRight: '0.5rem' }}>
                        Liczba atomowa: {atomicRange[0]}–{atomicRange[1]}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="118"
                        value={atomicRange[1]}
                        onChange={(e) => setAtomicRange([1, Number(e.target.value)])}
                      />
                      <div style={{ marginTop: "1rem" }}>
                        <button
                          onClick={() => window.open('https://keksiktusik.github.io/BazyDanych/ar-editor.html', '_blank')}
                          style={{
                            backgroundColor: '#00ffff',
                            color: '#000',
                            padding: '10px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            boxShadow: '0 0 12px #00ffff',
                            cursor: 'pointer',
                            animation: 'pulse 2s infinite'
                          }}
                        >
                          🧬 Edytor Wiązań
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
            <div ref={mountRef} className="scene-container" />
            <button onClick={exportCollectionAsGLB}>📦 Eksportuj kolekcję jako GLB</button>
            {isVisible && <p className="element-info">{elementInfo}</p>}

            {selectedAtom && (
              <>
                <button
                  onClick={() => addToCustomCollection(selectedAtom.atomic_number)}
                  style={{ marginTop: "0.5rem" }}
                >
                  ➕ Dodaj do kolekcji
                </button>

                <div style={{ marginTop: "1rem" }}>
                  <ReactQRCode
                    value={`https://keksiktusik.github.io/BazyDanych/ar-view.html?id=${selectedAtom.id}`}
                    size={128}
                  />
                </div>

                {selectedAtom.model_url && (
                  <div style={{ marginTop: "1rem" }}>
                    <h3>Model 3D:</h3>
                    <model-viewer
                      src={selectedAtom.model_url}
                      auto-rotate
                      camera-controls
                      style={{
                        width: "100%",
                        maxWidth: "300px",
                        height: "auto",
                        aspectRatio: "1",
                      }}
                      ar
                      shadow-intensity="1"
                      environment-image="neutral"
                    ></model-viewer>
                  </div>
                )}
              </>
            )}

            <div
              className="grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))",
                gap: "6px",
                marginTop: "1rem",
              }}
            >

              {filteredElements
                .sort((a, b) => a.atomic_number - b.atomic_number)
                .map(({ id, symbol, atomic_number, category, name, model_url }, index) => {
                  const row = Math.ceil(atomic_number / 18);
                  const col = ((atomic_number - 1) % 18) + 1;
                  return (
                    <div key={index} style={{ display: 'inline-block' }}>
                      <button
                        onClick={() => {
                          console.log("sygnal2");
                          setElementInfo(`${name} (${symbol}), liczba atomowa: ${atomic_number}`);
                          setSelectedAtom({ id, symbol, atomic_number, category, name, model_url });
                          setIsVisible(true);
                        }}
                        style={{
                          gridRowStart: row,
                          gridColumnStart: col,
                          backgroundColor: categoryColors[category] || "gray",
                          width: "50px",
                          height: "50px",
                          color: "white",
                        }}
                      >
                        {symbol}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "400px",
              margin: "1rem auto",
            }}
          >
            <h2>Wybierz rodzaj wiązania</h2>
            <ul>
              {bondTypes.map((bond) => (
                <button
                  key={bond.id}
                  className={`bond-option ${selectedBondType === bond.id ? 'selected' : ''}`}
                  onClick={() => handleSelectBond(bond.id)}
                >
                  <span>wiązanie {bond.label}</span>
                  <div></div>
                </button>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ) : (

      <div>
        <div style={{ marginTop: "1rem" }}>
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <button onClick={() => setIsOptionsOpen(prev => !prev)}>
                ⚙️ {isOptionsOpen ? "Ukryj opcje konfiguracji" : "Pokaż opcje konfiguracji"}
              </button>

              {isOptionsOpen && (
                <div>
                  <h3>➕ Dodaj ręcznie numer atomowy</h3>
                  <input
                    type="number"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="np. 8"
                  />
                  <button
                    onClick={() => {
                      const num = parseInt(manualInput);
                      if (!isNaN(num)) {
                        addToCustomCollection(num);
                        setManualInput(""); // wyczyść input
                      }
                    }}
                  >
                    Dodaj
                  </button>


                  <div>
                    <input
                      type="text"
                      value={formulaInput}
                      onChange={e => setFormulaInput(e.target.value)}
                      placeholder="Wpisz wzór, np. H2O, CO2"
                    />
                    <button onClick={() => generateFromFormula(formulaInput)}>Generuj</button>
                  </div>

                  <button
                    style={{ marginLeft: "1rem" }}
                    onClick={() => generateCollectionFromAtomicNumbers(customAtomicNumbers)}
                  >
                    Utwórz kolekcję z wybranych
                  </button>
                  {/* <button onClick={saveCollection}>Zapisz kolekcję</button> */}
                  <div style={{ position: "absolute", right: 20, top: 100, width: 250 }}>
                    <h4>💾 Zapisane konfiguracje</h4>

                    <input
                      type="text"
                      placeholder="Nazwa konfiguracji"
                      value={newConfigName}
                      onChange={(e) => setNewConfigName(e.target.value)}
                    />
                    <button onClick={saveCurrentConfiguration} disabled={isSaving || !canSaveWithValency(atomCollection, bondsRef.current)}>
                      {isSaving ? "Zapisywanie..." : "Zapisz"}
                    </button>
                    <div className="valency-hints">
                      {
                        (() => {
                          const bondCount = {};
                          // Załóżmy, że masz tablicę wiązań w zmiennej bonds
                          bondsRef.current.forEach(({ atom1Id, atom2Id }) => {
                            bondCount[atom1Id] = (bondCount[atom1Id] || 0) + 1;
                            bondCount[atom2Id] = (bondCount[atom2Id] || 0) + 1;
                          });

                          return atomCollection.map(atom => {
                            const expected = valencyMap[atom.symbol];
                            const actual = bondCount[atom.relative_id] || 0;

                            if (actual === 0) {
                              return <div key={atom.relative_id} style={{ color: 'orange' }}>
                                {atom.symbol} nie ma wiązań
                              </div>;
                            }
                            if (actual > expected) {
                              return <div key={atom.relative_id} style={{ color: 'red' }}>
                                {atom.symbol} ma za dużo wiązań ({actual} zamiast maks. {expected})
                              </div>;
                            }
                            return null;
                          });
                        })()
                      }
                    </div>
                    <ul style={{ marginTop: "1rem" }}>
                      {savedConfigurations.map((conf, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          <strong>{conf.name}</strong>
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button onClick={() => loadConfiguration(conf)}>Wczytaj</button>
                            <button onClick={() => deleteConfiguration(conf.name)}>Usuń</button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <hr style={{ margin: "1rem 0" }} />

                    <h4>🧪 Obecna konfiguracja</h4>
                    <ul>
                      {atomCollection.map((atom) => (
                        <li key={atom.relative_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>Atom #{atom.atomic_number} </span>
                          <button onClick={() => removeAtomByRelativeId(atom.relative_id)}>Usuń</button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <button onClick={() => setViewMode("single")}>🔬 Pojedynczy model</button>
                    <button onClick={() => setViewMode("collection")}>🧪 Kolekcja modeli</button>

                  </div>

                  <div>
                    <div className="filters" style={{ marginBottom: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Szukaj (nazwa lub symbol)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginRight: '1rem' }}
                      />
                      <details className="menu-section">
                        <summary>kategorie</summary>
                        <div style={{ marginRight: '1rem' }}>

                          <label>Wybierz kategorie:</label>
                          {Object.entries(categoryColors).map(([key, color]) => (
                            <div key={key}>
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(key)}
                                onChange={() =>
                                  setSelectedCategories(prev =>
                                    prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
                                  )
                                }
                              />
                              <span style={{ marginLeft: '8px', color }}>{key}</span>
                            </div>
                          ))}

                        </div>
                      </details>
                      <label style={{ marginRight: '0.5rem' }}>
                        Liczba atomowa: {atomicRange[0]}–{atomicRange[1]}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="118"
                        value={atomicRange[1]}
                        onChange={(e) => setAtomicRange([1, Number(e.target.value)])}
                      />
                      <div style={{ marginTop: "1rem" }}>
                        <button
                          onClick={() => window.open('https://keksiktusik.github.io/BazyDanych/ar-editor.html', '_blank')}
                          style={{
                            backgroundColor: '#00ffff',
                            color: '#000',
                            padding: '10px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            boxShadow: '0 0 12px #00ffff',
                            cursor: 'pointer',
                            animation: 'pulse 2s infinite'
                          }}
                        >
                          🧬 Edytor Wiązań
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
            <div ref={mountRef} className="scene-container" />
            <button onClick={exportCollectionAsGLB}>📦 Eksportuj kolekcję jako GLB</button>
            {isVisible && <p className="element-info">{elementInfo}</p>}

            {selectedAtom && (


              <>
                <button
                  onClick={() => addToCustomCollection(selectedAtom.atomic_number)}
                  style={{ marginTop: "0.5rem" }}
                >
                  ➕ Dodaj do kolekcji
                </button>


                <div style={{ marginTop: "1rem" }}>
                  <ReactQRCode
                    value={`https://keksiktusik.github.io/BazyDanych/ar-view.html?id=${selectedAtom.id}`}
                    size={128}
                  />


                </div>
                {selectedAtom.model_url && (
                  <div style={{ marginTop: "1rem" }}>
                    <h3>Model 3D:</h3>
                    <model-viewer
                      src={selectedAtom.model_url}
                      auto-rotate
                      camera-controls
                      style={{ width: "300px", height: "300px" }}
                      ar
                      shadow-intensity="1"
                      environment-image="neutral"
                    ></model-viewer>
                  </div>
                )}
              </>
            )}

            <div
              className="grid gap-5 mt-4"
              style={{ display: "grid", gridTemplateColumns: "repeat(18, 50px)", gridAutoRows: "50px" }}
            >

              {filteredElements
                .sort((a, b) => a.atomic_number - b.atomic_number)
                .map(({ id, symbol, atomic_number, category, name, model_url }, index) => {
                  const row = Math.ceil(atomic_number / 18);
                  const col = ((atomic_number - 1) % 18) + 1;
                  return (
                    <div key={index} style={{ display: 'inline-block' }}>
                      <button
                        onClick={() => {
                          console.log("sygnal2");
                          setElementInfo(`${name} (${symbol}), liczba atomowa: ${atomic_number}`);
                          setSelectedAtom({ id, symbol, atomic_number, category, name, model_url });
                          setIsVisible(true);
                        }}
                        style={{
                          gridRowStart: row,
                          gridColumnStart: col,
                          backgroundColor: categoryColors[category] || "gray",
                          width: "50px",
                          height: "50px",
                          color: "white",
                        }}
                      >
                        {symbol}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
          <div style={{ position: "absolute", left: 20, top: 400, width: 250 }}>
            <h2>Wybierz rodzaj wiązania</h2>
            <ul>
              {bondTypes.map((bond) => (
                <button
                  key={bond.id}
                  className={`bond-option ${selectedBondType === bond.id ? 'selected' : ''}`}
                  onClick={() => handleSelectBond(bond.id)}
                >
                  <span>wiązanie {bond.label}</span>
                  <div>

                  </div>
                </button>
              ))}
            </ul>
          </div>
        </div>
      </div >
    )
  );
};

export default Scene;
