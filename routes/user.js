const bcrypt = require("bcrypt");
const saltRounds = 10;
const currentYear = new Date().getFullYear();
const month30 = ["04", "06", "09", "11"]; // Months that only has 30 days
const minYear = 1500;

const fn = require("../lib/other"); // Bring in user-defined functions

/* ------------------------------ signup 처리 호출 ------------------------------ */
exports.signup = function(req, res) {
  var message = "";
  var pw = req.body.password;
  var pw_c = req.body.password_confirm;
  var inputYear = req.body.yy;
  var inputMonth = req.body.mm;
  var inputDate = req.body.dd;
  var regUserids = [];

  db.query('SELECT ?? FROM ??', ['user_id', 'user'], function(err, results, fields) {
    results.forEach(function(user) {
      regUserids.push(user.user_id);
    });

    if (req.method == "POST") { // 요청이 POST일 때만 처리
      // 최대 해당 월의 일 설정
      if (month30.includes(inputMonth))
        maxDate = 30;
      else if (inputMonth == 2 )
        maxDate = 29;
      else
        maxDate = 31;

      // 회원가입 처리
      if (regUserids.includes(req.body.userid)) { // 아이디 중복 체크
        message = "User ID already exist!";
        res.render('signup.ejs', { message: message, statusCode: 400, regUserids: regUserids });
      } else if (inputYear <= minYear || inputYear > currentYear || inputMonth == "" || inputDate <= 0 || inputDate > maxDate) { // 생년월일 체크
        message = "Please input date of birth correctly!";
        res.render('signup.ejs', { message: message, statusCode: 400, regUserids: regUserids });
      } else if (pw != pw_c) { // 비밀번호 확인
        message = "Password does not match.";
        res.render('signup.ejs', { message: message, statusCode: 400, regUserids: regUserids });
      } else { // DB에 회원정보 저장
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
          var post = {
            fullname: req.body.fullname,
            user_id: req.body.userid,
            password: hash,
            gender: req.body.gender,
            birth: req.body.yy + "-" + req.body.mm + "-" + req.body.dd,
            email: req.body.email,
            phone: req.body.no_tel,
          }

          var query = db.query('INSERT INTO user SET ?', post, function(error, results, fields) {
            if (error) throw error;
            message = "Account has been registered successfully.";
            res.render('login.ejs', { message: message, statusCode: 200 });
          });
        });
      }
    } else { // 요청이 POST가 아닐떄 회원가입 페이지 보내기
      res.render('signup.ejs', { message: message, regUserids: regUserids });
    }

    /* Status Code:
     * 1xx informational response – the request was received, continuing process (정상 반응)
     * 2xx successful – the request was successfully received, understood, and accepted (성공적으로 됐을 때)
     * 3xx redirection – further action needs to be taken in order to complete the request (계속 해야 할 때)
     * 4xx client error – the request contains bad syntax or cannot be fulfilled (사용자가 잘못했을 때)
     * 5xx server error – the server failed to fulfill an apparently valid request (서버로부터 오류 띄웠을 때)
     */
  });
};

/* ------------------------------ login 처리 호출 ------------------------------ */
exports.login = function(req, res) {
  var message = "";
  const userid = req.body.userid;
  const password = req.body.password;

  if (req.method == "POST") {
    db.query('SELECT ?? FROM ?? WHERE user_id = ?;', [['user_id', 'password'], 'user', userid], function(err, results, fields) {
      if (err) throw err;
      if (results.length > 0) {
        bcrypt.compare(password, results[0].password, function(err, result) {
          if (result === true) {
            req.session.loggedin = true;
            req.session.user_id = results[0].user_id;
            let redirectUrl = req.session.redirectUrl || '/home';
            res.redirect(redirectUrl);
          } else {
            message = "Incorrect username or password!";
            res.render('login.ejs', { message: message, statusCode: 400 });
          }
        });
      } else {
        message = "Incorrect username or password!";
        res.render('login.ejs', { message: message, statusCode: 400 });
      }
    });

  } else {
    res.render('login.ejs', {
      message: message,
      statusCode: 100
    });
  }

};

/* ------------------------------ logout 처리 호출 ------------------------------ */
exports.logout = function(req, res) {
  req.session.destroy(function(err) {
    res.redirect("/login");
  })
};

/* ------------------------------ profile 정보수정 처리 호출 ------------------------------ */
/* exports.saveChanges = function(req, res) {
  var user_id = req.session.user_id;
  var pw = req.body.password;
  var new_pw = req.body.new_password;
  var new_pw_c = req.body.new_password_confirm;
  var inputYear = req.body.yy;
  var inputMonth = req.body.mm;
  var inputDate = req.body.dd;

  if (req.method == "POST") {
    // 최대 해당 월의 일 설정
    if (month30.includes(inputMonth))
      maxDate = 30;
    else if (inputMonth == 2 )
      maxDate = 29;
    else
      maxDate = 31;

    db.query('SELECT ?? FROM ?? WHERE user_id = ?', [['password'], 'user', user_id], function(err, results, fields) {
      if (err) throw err;
      bcrypt.compare(pw, results[0].password, function(err, result) {
        if (result === false || new_pw !== new_pw_c) {
          req.session.message = "Password does not match."
          res.redirect("/account/profile");
        } else if (inputYear <= minYear || inputYear > currentYear || inputMonth == "" || inputDate <= 0 || inputDate > maxDate) {
          req.session.message = "Please input date of birth correctly!"
          res.redirect("/account/profile");
        } else {
          if (new_pw) {
            bcrypt.hash(new_pw, saltRounds, function(err, hash) {
              var post = {
                fullname: req.body.fullname,
                password: hash,
                gender: req.body.gender,
                birth: req.body.yy + "-" + req.body.mm + "-" + req.body.dd,
                email: req.body.email,
                phone: req.body.no_tel
              }

              db.query('UPDATE user SET fullname = ?, password = ?, gender = ?, birth = ?, email = ?, phone = ? WHERE user_id = ?', [post.fullname, post.password, post.gender, post.birth, post.email, post.phone, user_id], function (error, results, fields) {
                if (error) throw error;
                req.session.message = "Changes have been saved.";
                res.redirect("/account/profile");
              });
            });
          } else {
            var post = {
              fullname: req.body.fullname,
              gender: req.body.gender,
              birth: inputYear + "-" + inputMonth + "-" + inputDate,
              email: req.body.email,
              phone: req.body.no_tel
            }

            db.query('UPDATE user SET fullname = ?, gender = ?, birth = ?, email = ?, phone = ? WHERE user_id = ?', [post.fullname, post.gender, post.birth, post.email, post.phone, user_id], function (error, results, fields) {
              if (error) throw error;
              req.session.message = "Changes have been saved.";
              res.redirect("/account/profile");
            });
          }
        }
      });
    });
  }
}; */

/* ------------------------------ account 루트 처리 호출 ------------------------------ */
/*exports.openSubPage = function(req, res) {
  var reqSubPage = req.params.subPage;
  var reqShopId = req.params.shopId;
  var user_id = req.session.user_id;

  // 로그인된 상태 아니면 로그인 페이지로 이동
  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  } else {
    if(reqSubPage === "profile") {
      // 로그인된 아이디의 해당 정보들을 가져오고 profile 페이지로 넘겨줌
      db.query('SELECT * FROM ?? WHERE user_id = ?', ['user', user_id], function(err, results, fields) {
        res.render('profile.ejs', {
          user_id: user_id,
          data: results,
          sess: req.session,
          formatNum: fn.formatNum
        });
      });
    } else if (reqSubPage === "manage-address") {
      var sql = `SELECT a.address_id, a.recipient, a.address, a.state, a.city, a.zip, a.phone, m.default_address
                 FROM address as a
                    RIGHT OUTER JOIN user as m ON a.address_id = m.default_address
                 WHERE m.user_id = ?;

                 SELECT * FROM address WHERE user_id = ?; `
      var params = [user_id, user_id];

      if (req.session.openAddressInfo == null) {
        req.session.openAddressInfo = { recipient: "", address: "", city: "", state: "", zip: "", phone: "" };
      }

      db.query(sql, params, function(err, results, fields) {
        res.render('address.ejs', {
          user_id: user_id,
          defAddr: results[0][0],
          othAddr: results[1],
          sess: req.session
        });
      });
    } else if (reqSubPage === "purchase-history") {
      var sql = `SELECT t.trans_id, o.order_id, p.product, o.product_id, o.type, o.quantity, o.price, o.shop_id, t.date, o.status
                 FROM orders as o
                    RIGHT OUTER JOIN product as p ON p.product_id = o.product_id
                    RIGHT OUTER JOIN transaction as t ON t.trans_id = o.trans_id
                 WHERE o.user_id = ?
                 ORDER BY t.date DESC;

                 SELECT t.trans_id, t.date, COUNT(*) as count
                 FROM orders as o
                    RIGHT OUTER JOIN transaction as t ON t.trans_id = o.trans_id
                 WHERE o.user_id = ?
                 GROUP BY t.trans_id
                 ORDER BY t.date DESC;

                 SELECT * FROM image; `
      var params = [user_id, user_id];

      db.query(sql, params, function(err, results, fields) {
        res.render('purchase.ejs', {
          user_id: user_id,
          sess: req.session,
          formatNum: fn.formatNum,
          data: results[0],
          trans: results[1],
          images: results[2]
        });
      });
    } else if (reqSubPage === "payment-method") {
      db.query('SELECT s_money FROM ?? WHERE user_id = ?', ['user', user_id], function(err, results, fields) {
        res.render('paymeth.ejs', {
          user_id: user_id,
          hazelMoney: results[0].s_money,
          formatNum: fn.formatNum,
          sess: req.session
        });
      });
    } else if (reqSubPage === "seller-management") {
      var sql = `SELECT * FROM seller WHERE seller_id = ?;
                 SELECT * FROM product WHERE seller_id = ?;
                 SELECT * FROM shop WHERE seller_id = ?;
                 SELECT * FROM coupon WHERE seller_id = ?;
                 SELECT st.product_id, pr.product, pr.type_avail, st.shop_id, st.quantity, sh.shop
                 FROM stock as st
                    RIGHT OUTER JOIN shop as sh ON st.shop_id = sh.shop_id
                    RIGHT OUTER JOIN product as pr ON st.product_id = pr.product_id
                 WHERE st.seller_id = ? AND st.shop_id = ?; `
      var params = [user_id, user_id, user_id, user_id, user_id];

      if (req.session.selectedShop) {
        params.push(req.session.selectedShop);
      } else {
        params.push(0);
      }

      if (req.session.openProductInfo == null) {
        req.session.openProductInfo = { product_id: "", product: "", type_avail: "", info: "", price: "",
                                        discount: "", seller_id: "", rating: "", category: "", qrcode: "", noOfImg: "",
                                        images: [] };
      }

      if (req.session.openShopInfo == null) {
        req.session.openShopInfo = { shop_id: "", shop: "", address: "", phone: "", email: "", seller_id: "" };
      }

      if (req.session.openCouponInfo == null) {
        req.session.openCouponInfo = { coupon_code: "", value: "", min_spend: "", seller_id: "" };
        req.session.couponValidPeriod = { effectiveDate: "", expiryDate: "" };
      }

      db.query(sql, params, function(err, results, fields) {
        if (err) throw err;
        if (results[0].length > 0) {
          res.render('seller.ejs', {
            user_id: user_id,
            noOfCartItems: req.session.noOfCartItems,
            noOfWishlistItems: req.session.noOfWishlistItems,
            isSeller: "yes",
            seller: results[0][0],
            products: results[1],
            shops: results[2],
            coupons: results[3],
            stocks: results[4],
            formatNum: fn.formatNum,
            sess: req.session
          });
        } else {
          var emptySeller = { name: "", address: "", phone: "", email: "" };

          res.render('seller.ejs', {
            user_id: user_id,
            noOfCartItems: req.session.noOfCartItems,
            noOfWishlistItems: req.session.noOfWishlistItems,
            products: [],
            shops: [],
            stocks: [],
            coupons: [],
            isSeller: "no",
            seller: emptySeller,
            sess: req.session
          });
        }
      });
    }
  }
} */

/* ------------------------------ 구매후기 작성 페이지 열리는 처리 ------------------------------ */
/* exports.writeReview = function(req, res) {
  // TODO CODE
  var user_id = req.session.user_id;
  var reqTransId = req.params.transId;
  var reqOrderId = req.params.orderId;
  var reqProductId = req.params.productId;
  var reqType = req.params.type;
  var reqShopId = req.params.shopId;

  if (!req.session.loggedin) {
    req.session.redirectUrl = req.headers.referrer || req.originalUrl || req.url;
    res.redirect("/login");
    res.end();
  }

  let sql = `SELECT o.*, p.product, s.shop
            FROM orders as o
                INNER JOIN product as p on p.product_id = o.product_id
                INNER JOIN shop as s on s.shop_id = o.shop_id
            WHERE user_id = ? AND trans_id = ? AND order_id = ? AND o.product_id = ? AND type = ? AND o.shop_id = ?;`
  let params = [user_id, reqTransId, reqOrderId, reqProductId, reqType, reqShopId];
  db.query(sql, params, function (err, results, fields) {
    if (err) throw err;
    res.render('review.ejs', {
      user_id : user_id,
      data : results[0],
      sess: req.session,
    });
  });
} */

/* ------------------------------ 구매후기 작성 완료 처리 ------------------------------ */
/* exports.submitReview = function(req, res) {
  // TODO CODE
  var product_id = req.body.productId;
  var order_id = req.body.orderId;

  var post = {
    trans_id: req.body.transId,
    user_id: req.session.user_id,
    order_id: req.body.orderId,
    product_id: req.body.productId,
    type: req.body.type,
    shop_id: req.body.shopId,
    rating: req.body.rating,
    title: req.body.title,
    body: req.body.detail,
  }

  db.query (`INSERT INTO review SET ?`, post, function (err, results, fields) {
    if(err) throw err;
    let sql = `SELECT rating FROM product WHERE product_id = ?;
               SELECT product_id FROM review WHERE product_id = ?;`
    let params = [product_id, product_id];

    db.query(sql, params, function (err1, results1, fields1) {
      if (err1) throw err1;
      let currentRating = results1[0][0].rating == null ? 0 : results1[0][0].rating;
      let newRating = ((currentRating * (results1[1].length - 1)) + eval(post.rating)) / (results1[1].length);
      newRating = newRating.toFixed(3);

      sql = `UPDATE product SET rating = ? WHERE product_id = ?;
             UPDATE orders SET status = 'reviewed' WHERE order_id = ? AND product_id = ? AND type = ? AND shop_id = ?;`
      params = [newRating, product_id, order_id, product_id, post.type, post.shop_id];
      db.query(sql, params, function (err2, results2, fields2) {
        if (err2) throw err2;
        res.redirect("/account/purchase-history");
      });
    });
  });
} */
