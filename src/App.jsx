import './App.css'
import { useAuth0 } from '@auth0/auth0-react'
import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const socket = io("https://bidnow-backend.vercel.app")

function App() {
  let { loginWithRedirect, user, isAuthenticated, logout } = useAuth0()

  // States
  const [isDisabled, setIsDisabled] = useState(false)
  const [userBids, setUserBids] = useState({})
  const [bids, setBids] = useState([])
  const [highBids, setHighBids] = useState([])
  const [products, setProducts] = useState([{
    img: "https://images.unsplash.com/photo-1756745679023-2dc74f87ec60?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Artistic Embellishments",
    currentBid: 100,
    HighestBid: 0,
    lastBidderName: "No one",
    lastBidderBid: 0
  },
  {
    img: "https://www.christies.com/img/LotImages/2024/CKS/2024_CKS_23204_0046_000(star_wars_1977_original_vintage_film_poster_tim_and_greg_hildebrandt074017).jpg?mode=max",
    title: "Star Wars 1977",
    currentBid: 100,
    HighestBid: 0,
    lastBidderName: "No one",
    lastBidderBid: 0
  },
  {
    img: "https://images.pexels.com/photos/6836371/pexels-photo-6836371.jpeg",
    title: "Vintage Car",
    currentBid: 100,
    HighestBid: 0,
    lastBidderName: "No one",
    lastBidderBid: 0
  }])

  // Function to Place Bids
  const placeBidder = async (title, currentBid) => {
    if (!user) {
      loginWithRedirect()
    }
    else {
      try {
        setIsDisabled(true)
        let res = await fetch("https://bidnow-backend.vercel.app/placebid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: user.name, bid: currentBid, product_name: title })
        })
        let response = await res.json()
        console.log(response)
        lastBidsFetcher()
        highestBids()

        setUserBids(prev => ({...prev, [title] : true}))
        setTimeout(() => {
          setIsDisabled(false)
              toast.success(`Bid Placed!`, {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark"
            })
        }, 3000)
      }
      catch (error) {
        console.error("Error Placing Bid ", error)
        setIsDisabled(false)
      }
    }
  }

  // Function to retrive last Bids
  const lastBidsFetcher = async () => {
    try {
      let res = await fetch("https://bidnow-backend.vercel.app/lastbids")
      let response = await res.json()
      setBids(response)
      setProducts(updatedProducts)
    }
    catch (error) {
      console.error("Error fetching Last Bids", error)
    }
  }

  // Function to Check Highest Bids
  const highestBids = async () => {
    try {
      let res = await fetch("https://bidnow-backend.vercel.app/highestbid")
      let response = await res.json()
      setHighBids(response)
      setProducts(updatedHighBids)
    }
    catch (error) {
      console.error("Error fetching Highest Bids", error)
    }
  }

  // After user login checking its bids
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("✅ Logged in user:", user);
        toast.success(`Logged In !`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark"
      })
    }
    const fetchUserBids = async()=>{
      if(user){
        try{
          let res = await fetch(`https://bidnow-backend.vercel.app/user-bids/${user.name}`)
          let bidProducts = await res.json()

          const bidsObj = bidProducts.reduce((acc, productName)=>{
            acc[productName] = true
            return acc
          },{})

          setUserBids(bidsObj)
        }
        catch(error){
          console.error("Error fetching Bids", error)
        }
      }
    }
   fetchUserBids()
  }, [isAuthenticated, user]);

  // Updating data after a bid placed
  useEffect(() => {
    if (bids.length > 0) {
      const updatedProducts = products.map(product => {
        const matchingBid = bids.find(b => b.product_name === product.title);
        if (matchingBid) {
          return {
            ...product,
            lastBidderName: matchingBid.name,
            lastBidderBid: matchingBid.bid,
            currentBid: matchingBid.bid + 1
          };
        }
        return product;
      });

      setProducts(updatedProducts);
    }
  }, [bids])

  useEffect(() => {
    if (highBids.length > 0) {
      const updatedHighBids = products.map(product => {
        const matchingBid = highBids.find(h => h.product_name === product.title)
        if (matchingBid) {
          return {
            ...product,
            HighestBid: matchingBid.bid
          }
        }
        return product
      })
      setProducts(updatedHighBids)
    }
  }, [highBids])

  // WebSocket :- Real time Updates
  useEffect(() => {
    lastBidsFetcher()
    highestBids()

    socket.on("bidPlaced", (data)=>{
      lastBidsFetcher()
      highestBids()
    })
    return () => {
      socket.off("bidPlaced")
    }
  }, [])

  return (
    <>
        <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="dark"
      />
      <header className='flex flex-col h-[90vh] px-[10%] pt-[10px]'>
        <div className='flex justify-between h-[7%]'>
          <div className='flex gap-2 items-center'>
            <img className='invert w-7' src="rod.svg" alt="" />
            <span className='text-white font-bold text-xl font-sans'>Bid Now</span>
          </div>
          <div className='flex items-center gap-2'>
            {isAuthenticated ? <button className='text-[#1a4840] bg-white py-1.5 rounded-4xl px-5 cursor-pointer' onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Log Out</button> : <button className='text-[#1a4840] bg-white py-1.5 rounded-4xl px-5 cursor-pointer' onClick={() => loginWithRedirect()}>SignIn</button>} 
            {isAuthenticated && <span>{`Hi ${user.name.split(" ")[0]}`}</span>}
          </div>
        </div>
        <section className='flex gap-2 pt-12 h-[93%]'>
          <div className='flex flex-col gap-6 w-1/2 pt-20 text-white'>
            <p className='font-bold text-xl font-sans'>Bid & collect digital items.</p>
            <p className='text-sm'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ducimus, dolor. Earum deleniti sunt voluptas, odio sint nulla ducimus velit corporis veritatis omnis.</p>
            <p className='font-bold text-xl font-sans'>842M &nbsp;&nbsp;&nbsp; 842M &nbsp;&nbsp;&nbsp;&nbsp; 8 </p>
            <p className='text-xs relative bottom-6'>Total Product &nbsp; Total Auction &nbsp; Total Category</p>
          </div>
          <div className='w-1/2 flex gap-2'>
            <div className='flex flex-col gap-2 pt-12'>
              <div className='flex gap-5 items-center bg-white rounded-xl py-4 w-[210px] pl-4'>
                <img className='w-4' src="proof.gif" alt="" />
                <span>Proof of quality</span>
              </div>
              <img className='w-[400px] rounded-tl-4xl' src="buildings.jpg" alt="" />
            </div>
            <div>
              <img className='w-[500px] rounded-tr-4xl invisible md:visible' src="https://plus.unsplash.com/premium_photo-1723618936097-f78940fb26eb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
            </div>
          </div>
        </section>
      </header>
      {/* Products Dashboard */}
      <section className='rounded-tl-4xl rounded-tr-4xl mt-8 bg-white px-[10%] flex gap-8 flex-wrap justify-center'>
        {/* Products */}
        {products.map((product) => {
          return (
            <div className='pt-12'>
              <div className='p-2 flex flex-col w-[300px] border border-gray-300 rounded-lg'>
                <img className='rounded-lg' src={product.img} alt="" />
                <div className='flex items-center justify-between'>
                  <span>{product.title}</span>
                  <img className='relative bottom-14' src="hammer.png" alt="" />
                </div>
                <div className='flex px-5 text-center self-center mb-2'>
                  <img src="hammer.png" alt="" />
                  <span className='text-green-500'>Highest Bid <br></br> ${product.HighestBid}</span>
                </div>
                <button disabled={isDisabled || userBids[product.title]} className={`py-2 px-4 rounded-lg mx-5 font-semibold cursor-pointer 
    ${isDisabled || userBids[product.title] ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-green-500 text-white"}`} onClick={() => placeBidder(product.title, product.currentBid)}>Place Bid ${product.currentBid}</button>
                <span className='text-center text-gray-700 text-sm'>Last Bidder  : {product.lastBidderName} ${product.lastBidderBid}</span>
              </div>
            </div>
          )
        })}

      </section>
    </>
  )
}

export default App
